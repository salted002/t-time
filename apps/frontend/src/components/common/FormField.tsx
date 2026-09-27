import { useId, type ReactNode } from 'react'
import {
  Controller,
  type Control,
  type ControllerRenderProps,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form'

import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'

type FieldControlProps<T extends FieldValues, N extends FieldPath<T>> = ControllerRenderProps<
  T,
  N
> & {
  id: string
  'aria-invalid': boolean
}

interface FormFieldProps<T extends FieldValues, N extends FieldPath<T>> {
  control: Control<T>
  name: N
  label: string
  required?: boolean
  description?: string
  children: (field: FieldControlProps<T, N>) => ReactNode
}

export function FormField<T extends FieldValues, N extends FieldPath<T>>({
  control,
  name,
  label,
  required = false,
  description,
  children,
}: FormFieldProps<T, N>) {
  const id = useId()

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined}>
          <FieldLabel htmlFor={id}>
            {label}
            {required && (
              <span aria-hidden className="text-destructive">
                *
              </span>
            )}
          </FieldLabel>
          {children({ ...field, id, 'aria-invalid': fieldState.invalid })}
          {description && !fieldState.error && <FieldDescription>{description}</FieldDescription>}
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )
}
