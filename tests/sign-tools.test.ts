import test from 'ava';
import sinon from 'sinon';
import { registerSignTools } from '../src/tools/sign-tools.js';
import { ToolFactory } from '../src/tool-factory.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BotConnection } from '../src/bot-connection.js';
import type mineflayer from 'mineflayer';
import { Vec3 } from 'vec3';

function makeFactory() {
  const mockServer = { tool: sinon.stub() } as unknown as McpServer;
  const mockConnection = {
    checkConnectionAndReconnect: sinon.stub().resolves({ connected: true })
  } as unknown as BotConnection;
  return new ToolFactory(mockServer, mockConnection);
}

// ─── Registration tests ───────────────────────────────────────────────────────

test('registerSignTools registers place-sign tool', (t) => {
  const factory = makeFactory();
  const mockBot = {} as Partial<mineflayer.Bot>;
  registerSignTools(factory, () => mockBot as mineflayer.Bot);

  const calls = (factory['server'] as any).tool.getCalls();
  const call = calls.find((c: any) => c.args[0] === 'place-sign');
  t.truthy(call);
  t.true(call.args[1].includes('sign'));
});

test('registerSignTools registers read-sign tool', (t) => {
  const factory = makeFactory();
  const mockBot = {} as Partial<mineflayer.Bot>;
  registerSignTools(factory, () => mockBot as mineflayer.Bot);

  const calls = (factory['server'] as any).tool.getCalls();
  const call = calls.find((c: any) => c.args[0] === 'read-sign');
  t.truthy(call);
  t.true(call.args[1].includes('sign'));
});

// ─── read-sign behaviour tests ────────────────────────────────────────────────

test('read-sign returns error when no sign block at position', async (t) => {
  const factory = makeFactory();

  const mockBot = {
    blockAt: sinon.stub().returns({ name: 'air' }),
    inventory: { items: sinon.stub().returns([]) },
    pathfinder: { goto: sinon.stub().resolves() },
    world: {},
  } as unknown as mineflayer.Bot;

  registerSignTools(factory, () => mockBot);

  const serverStub = (factory['server'] as any).tool as sinon.SinonStub;
  const readSignCall = serverStub.getCalls().find((c: any) => c.args[0] === 'read-sign');
  const executor = readSignCall.args[3];

  const result = await executor({ x: 0, y: 64, z: 0 });
  t.true(result.content[0].text.includes('No sign'));
});

test('read-sign returns error when block entity data not loaded', async (t) => {
  const factory = makeFactory();

  const mockBot = {
    blockAt: sinon.stub().returns({ name: 'oak_sign', position: new Vec3(0, 64, 0) }),
    inventory: { items: sinon.stub().returns([]) },
    pathfinder: { goto: sinon.stub().resolves() },
    world: { getBlockEntity: sinon.stub().returns(null) },
  } as unknown as mineflayer.Bot;

  registerSignTools(factory, () => mockBot);

  const serverStub = (factory['server'] as any).tool as sinon.SinonStub;
  const readSignCall = serverStub.getCalls().find((c: any) => c.args[0] === 'read-sign');
  const executor = readSignCall.args[3];

  const result = await executor({ x: 0, y: 64, z: 0 });
  t.true(result.content[0].text.includes('not loaded'));
});

test('read-sign returns sign lines when block entity loaded', async (t) => {
  const factory = makeFactory();

  const nbtData = {
    front_text: {
      messages: [
        '{"text":"FACT_TABLE"}',
        '{"text":"orders"}',
        '{"text":""}',
        '{"text":""}',
      ]
    }
  };

  const mockBot = {
    blockAt: sinon.stub().returns({ name: 'oak_sign', position: new Vec3(5, 64, 5) }),
    inventory: { items: sinon.stub().returns([]) },
    pathfinder: { goto: sinon.stub().resolves() },
    world: { getBlockEntity: sinon.stub().returns(nbtData) },
  } as unknown as mineflayer.Bot;

  registerSignTools(factory, () => mockBot);

  const serverStub = (factory['server'] as any).tool as sinon.SinonStub;
  const readSignCall = serverStub.getCalls().find((c: any) => c.args[0] === 'read-sign');
  const executor = readSignCall.args[3];

  const result = await executor({ x: 5, y: 64, z: 5 });
  t.true(result.content[0].text.includes('FACT_TABLE'));
  t.true(result.content[0].text.includes('orders'));
});

// ─── place-sign behaviour tests ───────────────────────────────────────────────

test('place-sign returns error when no sign in inventory', async (t) => {
  const factory = makeFactory();

  const mockBot = {
    blockAt: sinon.stub().callsFake((pos: Vec3) => {
      if (pos.y === 63) return { name: 'stone' }; // block below
      return { name: 'air' };                      // target position
    }),
    inventory: { items: sinon.stub().returns([]) },
    pathfinder: { goto: sinon.stub().resolves() },
    canSeeBlock: sinon.stub().returns(true),
    equip: sinon.stub().resolves(),
  } as unknown as mineflayer.Bot;

  registerSignTools(factory, () => mockBot);

  const serverStub = (factory['server'] as any).tool as sinon.SinonStub;
  const placeCall = serverStub.getCalls().find((c: any) => c.args[0] === 'place-sign');
  const executor = placeCall.args[3];

  const result = await executor({ x: 0, y: 64, z: 0, line1: 'hello' });
  t.true(result.content[0].text.includes('No sign item'));
});

test('place-sign returns error when no solid block below', async (t) => {
  const factory = makeFactory();

  const mockBot = {
    blockAt: sinon.stub().returns({ name: 'air' }), // everything is air
    inventory: { items: sinon.stub().returns([{ name: 'oak_sign' }]) },
    pathfinder: { goto: sinon.stub().resolves() },
    canSeeBlock: sinon.stub().returns(true),
    equip: sinon.stub().resolves(),
  } as unknown as mineflayer.Bot;

  registerSignTools(factory, () => mockBot);

  const serverStub = (factory['server'] as any).tool as sinon.SinonStub;
  const placeCall = serverStub.getCalls().find((c: any) => c.args[0] === 'place-sign');
  const executor = placeCall.args[3];

  const result = await executor({ x: 0, y: 64, z: 0 });
  t.true(result.content[0].text.includes('no solid block directly below'));
});
