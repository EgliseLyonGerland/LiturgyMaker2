import { createRequire } from "node:module";

interface ConfigstoreInstance {
  has(key: string): boolean;
  get(key: string): unknown;
  set(key: string, value: unknown): void;
  delete(key: string): boolean;
}

type ConfigstoreConstructor = new (name: string) => ConfigstoreInstance;

const require = createRequire(import.meta.url);
const Configstore = require("configstore") as ConfigstoreConstructor;

let ENV = "dev";

const config = new Configstore("liturgy-maker");

export function setEnv(env: string): void {
  ENV = env;
}

export function has(key: string): boolean {
  return config.has(`${ENV}.${key}`);
}

export function get(key: string): unknown {
  return config.get(`${ENV}.${key}`);
}

export function set(key: string, value: unknown): void {
  config.set(`${ENV}.${key}`, value);
}

export function deleteKey(key: string): boolean {
  return config.delete(`${ENV}.${key}`);
}

export { deleteKey as delete };
