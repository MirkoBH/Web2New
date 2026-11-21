import { registerDecorator, ValidationOptions } from 'class-validator';

/** Año más nuevo aceptado: el actual + 1 (a fin de año ya se venden modelos del siguiente). */
export function anioMaximoPermitido(): number {
  return new Date().getFullYear() + 1;
}

/**
 * Valida que el año no supere el año actual + 1. Se calcula en cada
 * validación (no al arrancar), así sigue siendo correcto después del 1/1
 * aunque el servidor no se reinicie.
 */
export function AnioMaximo(opciones?: ValidationOptions): PropertyDecorator {
  return (objeto: object, propiedad: string | symbol) => {
    registerDecorator({
      name: 'anioMaximo',
      target: objeto.constructor,
      propertyName: String(propiedad),
      options: opciones,
      validator: {
        validate: (valor: unknown) =>
          typeof valor === 'number' && valor <= anioMaximoPermitido(),
        defaultMessage: () =>
          `El año no puede ser mayor a ${anioMaximoPermitido()}`,
      },
    });
  };
}
