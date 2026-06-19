declare module "react-dom" {
  export function flushSync<T>(callback: () => T): T;
}
