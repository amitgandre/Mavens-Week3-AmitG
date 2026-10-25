// Test harness only: initialize the same native module used by the n8n server.
// No installed n8n files are modified.
const {createRequire}=require('module');
const req=createRequire('/usr/local/lib/node_modules/n8n/dist/commands/execute.js');
req('reflect-metadata');
const {Execute}=req('/usr/local/lib/node_modules/n8n/dist/commands/execute.js');
const {Container}=req('@n8n/di');
const {ModuleRegistry}=req('@n8n/backend-common');
const original=Execute.prototype.init;
Execute.prototype.init=async function(){await original.call(this);await Container.get(ModuleRegistry).initModules('main',['data-table']);};
