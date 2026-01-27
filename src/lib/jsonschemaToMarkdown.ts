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
      // "",
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
    let validDocs = " with valid values:\n\n";

    const enumTypes = schema.anyOf as Array<Exclude<JSONSchema, boolean>>;
    for (const enumType of enumTypes) {
      const typeDocs = jsonschemaToMarkdown(enumType, {
        level: level < 4 ? 4 : level + 1,
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
  } else if (type === "staticEnum") {
    let validDocs = " with valid values:\n\n";

    const enumTypes = schema.enum ?? [];
    for (const enumType of enumTypes) {
      const levelStr = levels[level < 4 ? 4 : level + 1];

      const typeDocs = levelStr + " `" + enumType + "`";

      validDocs += typeDocs + "\n";
    }

    return buildString({
      levelStr,
      prefix,
      includeType,
      type: "enum",
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

  if (schema.enum !== undefined) {
    return { type: "staticEnum", required, schema };
  } else if (
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
  } else if (schema.$ref !== undefined) {
    return { type: "external", required, schema };
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
  let result = options.levelStr + " ";

  if (options.prefix !== "") {
    result += `\`${options.prefix}${options.type === "array" ? "[]:" : ":"}\``;
    if (options.required) {
      result += " (required)";
    }
    if (options.levelStr.includes("#")) {
      result += "\n\n";
    } else {
      result += " ";
    }
  }

  if (options.includeType) {
    result += `\`${options.type}\``;
  }

  if (options.type === "array") {
    result += " of ";
    result += (options.extraDocs || "").trim();
    if (options.includeDescription) {
      if (options.levelStr.includes("#")) {
        result += "\n\n";
      } else {
        result += " ";
      }
      result += options.desc || "";
    }
  } else {
    result += options.extraDocs || "";
  }

  if (options.type !== "array" && options.includeDescription) {
    const description =
      options.desc ||
      (options.levelStr.includes("#") ? "_No description provided..._" : "");

    if (options.levelStr.includes("#")) {
      result += "\n\n";
    } else {
      result += " ";
    }
    result += `${description.trim()}`;
    if (options.levelStr.includes("#")) {
      result += "\n\n";
    } else {
      result += " ";
    }
  }

  result += "\n\n";

  return result;
}
