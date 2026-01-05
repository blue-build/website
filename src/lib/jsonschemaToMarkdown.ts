import { type JSONSchema } from "json-schema-typed";

export function jsonschemaToMarkdown(
  inSchema: Exclude<JSONSchema, boolean>,
  options: {
    level?: number;
    levels?: string[];
    prefix?: string;
    includeDescription?: boolean;
    includeType?: boolean;
    useLevel?: boolean;
    root?: Exclude<JSONSchema, boolean>;
    excludedProps?: string[] | undefined;
  },
): string {
  const {
    level = 0,
    levels = [
      "##",
      "###",
      "####",
      "#####",
      "",
      "-",
      "\t-",
      "\t\t-",
      "\t\t\t-",
      "\t\t\t\t-",
    ],
    prefix = "",
    includeDescription = true,
    includeType = true,
    useLevel = true,
    root = inSchema,
    excludedProps = [],
  } = options;

  const { type, required, schema } = getType(root, inSchema, prefix);
  const levelStr = useLevel ? levels[level] : "";

  if (
    type === "boolean" ||
    type === "number" ||
    type === "string" ||
    type === "integer"
  ) {
    if (schema.const !== undefined) {
      return buildString({
        levelStr,
        prefix,
        includeType,
        type: schema.const,
        required,
        includeDescription,
        desc: inSchema.description ?? "",
      });
    }
    return buildString({
      levelStr,
      prefix,
      includeType,
      type,
      required,
      includeDescription,
      desc: inSchema.description ?? "",
    });
  } else if (type === "array") {
    const itemsDocs = jsonschemaToMarkdown(
      schema.items as Exclude<JSONSchema, boolean>,
      {
        level,
        useLevel: false,
        root,
      },
    );

    return buildString({
      levelStr,
      prefix,
      includeType,
      type,
      required,
      includeDescription,
      desc: inSchema.description ?? "",
      extraDocs: itemsDocs,
    });
  } else if (type === "object") {
    const props = schema.properties;
    let propDocs = "\n";

    for (const prop in props) {
      if (excludedProps.includes(prop)) continue;

      const propSchema = props[prop] as Exclude<JSONSchema, boolean>;
      const typeDocs = jsonschemaToMarkdown(propSchema, {
        level: level + 1,
        prefix: prop,
        root,
      });

      propDocs += typeDocs + "\n";
    }

    return buildString({
      levelStr,
      prefix,
      includeType,
      type,
      required,
      includeDescription,
      desc: inSchema.description ?? "",
      extraDocs: propDocs,
    });
  } else if (type === "enum") {
    let validDocs = "\n" + levels[level + 1] + " Valid values\n";

    const enumTypes = schema.anyOf as Array<Exclude<JSONSchema, boolean>>;
    for (const enumType of enumTypes) {
      const typeDocs = jsonschemaToMarkdown(enumType, {
        level: level + 2,
        root,
        includeDescription: false,
      });

      validDocs += typeDocs + "\n";
    }

    return buildString({
      levelStr,
      prefix,
      includeType,
      type,
      required,
      includeDescription,
      desc: inSchema.description ?? "",
      extraDocs: validDocs,
    });
  } else {
    return buildString({
      levelStr,
      prefix,
      includeType,
      type,
      required,
      includeDescription,
      desc: inSchema.description ?? "",
    });
  }
}

function getType(
  root: Exclude<JSONSchema, boolean>,
  schema: Exclude<JSONSchema, boolean>,
  propName: string,
): { type: string; required: boolean; schema: Exclude<JSONSchema, boolean> } {
  const required = (root.required ?? []).includes(propName);

  if (
    schema.type === "boolean" ||
    schema.type === "number" ||
    schema.type === "string" ||
    schema.type === "integer" ||
    schema.type === "array" ||
    schema.type === "object"
  ) {
    return { type: schema.type, required, schema };
  } else if (schema.$ref !== undefined && schema.$ref.startsWith("#/$defs/")) {
    const defName = schema.$ref.split("#/$defs/")[1];
    const defSchema = root.$defs?.[defName] as Exclude<JSONSchema, boolean>;
    if (defSchema !== undefined) {
      return getType(root, defSchema, defName);
    }
    return { type: "unknown", required, schema: defSchema };
  } else if (schema.anyOf !== undefined) {
    return { type: "enum", required, schema };
  } else {
    return { type: "unknown", required, schema };
  }
}

function buildString(options: {
  levelStr: string;
  prefix: string;
  includeType: boolean;
  type: string;
  required: boolean;
  includeDescription: boolean;
  desc: string;
  extraDocs?: string;
}): string {
  return `${options.levelStr} \
${options.prefix}${options.prefix !== "" && options.includeType ? "," : ""} \
${options.required ? "required" : ""} \
${options.includeType ? `\`${options.type}\`` : ""}${options.type !== "array" && options.includeDescription ? `\n${options.desc ?? (options.levelStr.includes("#") ? "_No description provided..._" : "")}\n` : ""} \
${options.type === "array" ? "of" : ""} ${options.extraDocs ?? ""}
${options.type === "array" ? options.desc : ""} \n`;
}
