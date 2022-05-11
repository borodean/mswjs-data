import { PrimaryKey } from '../primaryKey'
import {
  ModelDefinition,
  ModelDefinitionValue,
  NestedModelDefinition,
} from '../glossary'
import { NullableProperty } from '../nullable'
import { Relation } from '../relations/Relation'
import { isObject } from '../utils/isObject'

export type DefinitionTokenKind =
  | 'property'
  | 'nullableProperty'
  | 'primaryKey'
  | 'relationship'

export interface DefinitionToken {
  path: string[]
  value: ModelDefinitionValue
}

export class ModelAst {
  private tokens: Map<DefinitionTokenKind, DefinitionToken[]>

  constructor() {
    this.tokens = new Map()
  }

  /**
   * Get all model definition tokens by the kind.
   */
  public getTokens(kind: DefinitionTokenKind): DefinitionToken[] {
    return this.tokens.get(kind) || []
  }

  private addToken(
    kind: DefinitionTokenKind,
    path: string[],
    value: ModelDefinitionValue,
  ) {
    const prevTokens = this.tokens.get(kind) || []
    this.tokens.set(kind, [...prevTokens, { path, value }])
  }

  /**
   * Parse given model definition.
   */
  public static parse(
    definition: ModelDefinition,
    parentPath: string[] = [],
    ast: ModelAst = new ModelAst(),
  ): ModelAst {
    for (const [pointer, value] of Object.entries(definition)) {
      const path = parentPath.concat(pointer)

      if (value instanceof PrimaryKey) {
        ast.addToken('primaryKey', path, value)
        continue
      }

      if (value instanceof NullableProperty) {
        ast.addToken('nullableProperty', path, value)
        continue
      }

      // Relationships.
      if (value instanceof Relation) {
        ast.addToken('relationship', path, value)
        continue
      }

      // Nested objects.
      if (isObject<NestedModelDefinition>(value)) {
        ModelAst.parse(value, path, ast)
        continue
      }

      // Plain properties.
      ast.addToken('property', path, value)
    }

    return ast
  }
}
