import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function camelToSnake(str: string) {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

export function toSnakeCaseObject(obj: any): any {
  if (Array.isArray(obj)) return obj.map(toSnakeCaseObject);
  if (obj !== null && typeof obj === "object") {
    return Object.keys(obj).reduce((acc, key) => {
      const snakeKey = camelToSnake(key);
      let val = obj[key];
      if (typeof val === "object" && val !== null && !(val instanceof Date)) {
        val = toSnakeCaseObject(val);
      }
      acc[snakeKey] = val;
      return acc;
    }, {} as any);
  }
  return obj;
}

export function snakeToCamel(str: string) {
  return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
}

export function toCamelCaseObject(obj: any): any {
  if (Array.isArray(obj)) return obj.map(toCamelCaseObject);
  if (obj !== null && typeof obj === "object") {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = snakeToCamel(key);
      let val = obj[key];

      // Automatically parse JSON strings
      if (typeof val === "string") {
        const trimmed = val.trim();
        if ((trimmed.startsWith("[") && trimmed.endsWith("]")) || (trimmed.startsWith("{") && trimmed.endsWith("}"))) {
          try {
            val = JSON.parse(trimmed);
          } catch (e) {}
        }
      }

      if (typeof val === "object" && val !== null && !(val instanceof Date)) {
        val = toCamelCaseObject(val);
      }
      acc[camelKey] = val;
      return acc;
    }, {} as any);
  }
  return obj;
}
