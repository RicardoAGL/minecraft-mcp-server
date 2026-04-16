import { z } from 'zod';
import mineflayer from 'mineflayer';
import pathfinderPkg from 'mineflayer-pathfinder';
const { goals } = pathfinderPkg;
import { Vec3 } from 'vec3';
import { ToolFactory } from '../tool-factory.js';
import { log } from '../logger.js';
import { coerceCoordinates } from './coordinate-utils.js';

// Minecraft renders ~15 chars per sign line but allows up to 384 in the packet.
// Keep a reasonable cap so text doesn't silently truncate on older servers.
const SIGN_LINE_MAX = 80;

// Milliseconds to wait after placement for the server to open the sign editor.
// The server always processes sign placement synchronously; this covers round-trip latency.
const SIGN_PLACEMENT_WAIT_MS = 500;

function toJsonText(text: string): string {
  return JSON.stringify({ text });
}

export function registerSignTools(factory: ToolFactory, getBot: () => mineflayer.Bot): void {

  // ─── place-sign ────────────────────────────────────────────────────────────
  factory.registerTool(
    'place-sign',
    'Place a sign on top of the block at the given position and write up to 4 lines of text on it. The bot must have a sign item in its inventory. The target position must be air with a solid block directly below it.',
    {
      x: z.coerce.number().describe('X coordinate of the air block where the sign will appear'),
      y: z.coerce.number().describe('Y coordinate of the air block where the sign will appear'),
      z: z.coerce.number().describe('Z coordinate of the air block where the sign will appear'),
      line1: z.string().max(SIGN_LINE_MAX).optional().describe('First line of text (default: empty)'),
      line2: z.string().max(SIGN_LINE_MAX).optional().describe('Second line of text (default: empty)'),
      line3: z.string().max(SIGN_LINE_MAX).optional().describe('Third line of text (default: empty)'),
      line4: z.string().max(SIGN_LINE_MAX).optional().describe('Fourth line of text (default: empty)'),
    },
    async ({ x, y, z, line1 = '', line2 = '', line3 = '', line4 = '' }) => {
      ({ x, y, z } = coerceCoordinates(x, y, z));
      const bot = getBot();
      const placePos = new Vec3(x, y, z).floored();

      // Verify target position is air
      const targetBlock = bot.blockAt(placePos);
      if (targetBlock && targetBlock.name !== 'air') {
        return factory.createResponse(
          `Cannot place sign at (${x}, ${y}, ${z}): block ${targetBlock.name} already there.`
        );
      }

      // Need a solid block directly below to place the sign on
      const belowPos = placePos.offset(0, -1, 0);
      const belowBlock = bot.blockAt(belowPos);
      if (!belowBlock || belowBlock.name === 'air') {
        return factory.createResponse(
          `Cannot place sign at (${x}, ${y}, ${z}): no solid block directly below. Place a block at (${x}, ${y - 1}, ${z}) first.`
        );
      }

      // Find any sign item in inventory
      const signItem = bot.inventory.items().find(item => item.name.includes('_sign'));
      if (!signItem) {
        return factory.createResponse(
          'No sign item in inventory. Give the bot a sign (e.g. oak_sign) first.'
        );
      }
      await bot.equip(signItem, 'hand');
      log('info', `Equipping ${signItem.name} to place sign at (${x}, ${y}, ${z})`);

      // Move close enough to see the reference block
      if (!bot.canSeeBlock(belowBlock)) {
        const goal = new goals.GoalNear(belowPos.x, belowPos.y, belowPos.z, 3);
        await bot.pathfinder.goto(goal);
      }

      // Place the sign on top of the block below
      await bot.placeBlock(belowBlock, new Vec3(0, 1, 0));

      // Give the server a moment to process the placement and open the sign editor
      // before we send the update_sign packet.
      await new Promise<void>((resolve) => setTimeout(resolve, SIGN_PLACEMENT_WAIT_MS));

      const signBlock = bot.blockAt(placePos);
      if (!signBlock || !signBlock.name.includes('sign')) {
        return factory.createResponse(
          `Sign placed at (${x}, ${y}, ${z}) but text could not be written — sign block not found after placement.`
        );
      }

      // Send update_sign packet. The lines are JSON text components (1.20+ format).
      (bot as any)._client.write('update_sign', {
        location: signBlock.position,
        isFrontText: true,
        line1: toJsonText(line1),
        line2: toJsonText(line2),
        line3: toJsonText(line3),
        line4: toJsonText(line4),
      });

      log('info', `Written sign text at (${x}, ${y}, ${z})`);

      const nonEmpty = [line1, line2, line3, line4].filter(l => l.length > 0);
      return factory.createResponse(
        `Placed sign at (${x}, ${y}, ${z}) with text:\n` +
        (nonEmpty.length > 0 ? nonEmpty.join('\n') : '(empty)')
      );
    }
  );

  // ─── read-sign ─────────────────────────────────────────────────────────────
  factory.registerTool(
    'read-sign',
    'Read the front-face text from a sign at the given position. The bot must be close enough for the world to have loaded the block entity data.',
    {
      x: z.coerce.number().describe('X coordinate of the sign block'),
      y: z.coerce.number().describe('Y coordinate of the sign block'),
      z: z.coerce.number().describe('Z coordinate of the sign block'),
    },
    async ({ x, y, z }) => {
      ({ x, y, z } = coerceCoordinates(x, y, z));
      const bot = getBot();
      const pos = new Vec3(x, y, z).floored();
      const block = bot.blockAt(pos);

      if (!block || !block.name.includes('sign')) {
        return factory.createResponse(
          `No sign at (${x}, ${y}, ${z}). Found: ${block?.name ?? 'nothing'}.`
        );
      }

      // Block entity (tile entity) data lives in the world model.
      // getBlockEntity returns raw NBT or null if not loaded yet.
      const entity = (bot.world as any).getBlockEntity?.(pos);
      if (!entity) {
        // Move closer and try once more
        const goal = new goals.GoalNear(x, y, z, 2);
        await bot.pathfinder.goto(goal);
        const retryEntity = (bot.world as any).getBlockEntity?.(pos);
        if (!retryEntity) {
          return factory.createResponse(
            `Sign found at (${x}, ${y}, ${z}) but block entity data not loaded. ` +
            'Try standing closer and reading again.'
          );
        }
      }

      const data = (bot.world as any).getBlockEntity?.(pos);
      // 1.20+ signs store text in front_text.messages; older format used Text1..Text4.
      const messages: unknown[] = data?.front_text?.messages ??
        (data?.Text1 ? [data?.Text1, data?.Text2, data?.Text3, data?.Text4] : []);

      const lines = messages
        .map((raw) => {
          if (typeof raw !== 'string') return '';
          try {
            const parsed = JSON.parse(raw) as { text?: string };
            return parsed.text ?? '';
          } catch {
            return raw;
          }
        })
        .filter(l => l.length > 0);

      return factory.createResponse(
        lines.length > 0
          ? `Sign at (${x}, ${y}, ${z}):\n${lines.join('\n')}`
          : `Sign at (${x}, ${y}, ${z}) is empty.`
      );
    }
  );
}
