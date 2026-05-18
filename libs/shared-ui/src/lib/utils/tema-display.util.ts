export const SIN_NUM_CONTROL_LABEL = 'SIN NUM DE CONTROL';
export const SIN_FECHA_VENCIMIENTO_LABEL = 'SIN FECHA DE VENCIMIENTO';

export function formatNumControl(value?: string | null): string {
  return value?.trim() ? value : SIN_NUM_CONTROL_LABEL;
}

export function formatFechaVencimiento(
  value?: string | Date | null,
  formatter?: (value: string | Date) => string
): string {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return SIN_FECHA_VENCIMIENTO_LABEL;
  }

  return formatter ? formatter(value) : String(value);
}
