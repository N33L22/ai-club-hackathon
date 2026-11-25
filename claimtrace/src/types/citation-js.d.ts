/* Minimal typings for citation-js (the package ships without TypeScript types). */
declare module "@citation-js/core" {
  export class Cite {
    constructor(data?: unknown, options?: Record<string, unknown>);
    static async(data: unknown, options?: Record<string, unknown>): Promise<Cite>;
    data: Array<Record<string, unknown>>;
    format(format: string, options?: Record<string, unknown>): string;
  }
  export const plugins: {
    config: {
      get(name: string): {
        templates: { add(name: string, xml: string): void; has(name: string): boolean };
      };
    };
  };
}
declare module "@citation-js/plugin-csl";
declare module "@citation-js/plugin-bibtex";
declare module "@citation-js/plugin-ris";
