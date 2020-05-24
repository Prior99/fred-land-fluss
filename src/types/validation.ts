export type Validation =
    | {
          valid: false;
          categoryErrors: Map<string, string>;
      }
    | { valid: true };
