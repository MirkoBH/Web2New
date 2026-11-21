import { DefaultNamingStrategy, NamingStrategyInterface } from 'typeorm';

/**
 * Traduce los nombres de las propiedades (camelCase) a columnas snake_case,
 * la convención de PostgreSQL. Así `creadoEn` se guarda como `creado_en`
 * sin repetir `{ name: '...' }` en cada columna.
 */
export class EstrategiaNombresSnake
  extends DefaultNamingStrategy
  implements NamingStrategyInterface
{
  columnName(
    nombrePropiedad: string,
    nombrePersonalizado: string | undefined,
    prefijos: string[],
  ): string {
    const base = nombrePersonalizado ?? aSnake(nombrePropiedad);
    return prefijos.length > 0 ? `${aSnake(prefijos.join('_'))}_${base}` : base;
  }

  relationName(nombrePropiedad: string): string {
    return aSnake(nombrePropiedad);
  }

  joinColumnName(
    nombreRelacion: string,
    nombreColumnaReferenciada: string,
  ): string {
    return aSnake(`${nombreRelacion}_${nombreColumnaReferenciada}`);
  }
}

function aSnake(texto: string): string {
  return texto
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/__+/g, '_')
    .toLowerCase();
}
