import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Box, Button, Dialog, DialogTitle, MenuItem, TextField } from '@mui/material'
import { useMealsStore } from '../model/mealsStore'
import { localToday, type MealComplex } from '../../../shared/api'
import { categoryPrices } from '../model/prices'

const schema = yup.object({
  priceCategoryId: yup.string().required("Обов'язкове поле"),
  price: yup
    .string()
    .required("Обов'язкове поле")
    .matches(/^\d{1,8}(\.\d{1,2})?$/, 'Сума у форматі 120 або 120.50')
    .test('positive', 'Сума має бути більшою за 0', (v) => Number(v) > 0),
  validFrom: yup.string().required("Обов'язкове поле"),
})

type FormValues = yup.InferType<typeof schema>

const priceOf = (complex: MealComplex, categoryId?: string | null) =>
  (categoryId ? categoryPrices(complex.prices, categoryId, localToday()).current?.price : undefined) ?? ''

export const PriceDialog = ({
  complex,
  presetCategoryId,
  onClose,
}: {
  complex: MealComplex | null
  presetCategoryId?: string | null
  onClose: () => void
}) => {
  const categories = useMealsStore((s) => s.priceCategories)
  const isSaving = useMealsStore((s) => s.isSaving)
  const addPrice = useMealsStore((s) => s.addPrice)
  const { control, handleSubmit, reset, setValue } = useForm<FormValues>({
    mode: 'all',
    defaultValues: { priceCategoryId: '', price: '', validFrom: localToday() },
    resolver: yupResolver(schema),
  })

  useEffect(() => {
    if (complex) reset({ priceCategoryId: presetCategoryId ?? '', price: priceOf(complex, presetCategoryId), validFrom: localToday() })
  }, [complex, presetCategoryId, reset])

  const submit = async (values: FormValues) => {
    if (!complex) return
    await addPrice(complex.id, values)
    onClose()
  }

  return (
    <Dialog open={complex !== null} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>Ціна комплексу «{complex?.name}»</DialogTitle>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: '20px' }}>
        <Controller
          name="priceCategoryId"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              select
              label="Цінова категорія"
              error={!!error}
              helperText={error?.message}
              onChange={(e) => {
                field.onChange(e)
                if (complex) setValue('price', priceOf(complex, e.target.value), { shouldValidate: true })
              }}
            >
              {categories.filter((c) => c.active).map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </TextField>
          )}
        />
        <Controller
          name="price"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField {...field} label="Ціна, грн" error={!!error} helperText={error?.message} />
          )}
        />
        <Controller
          name="validFrom"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              type="date"
              label="Діє з"
              slotProps={{ inputLabel: { shrink: true } }}
              error={!!error}
              helperText={error?.message ?? 'Якщо на цю дату ціна вже є, її буде замінено. Уже зроблені замовлення зберігають свою ціну.'}
            />
          )}
        />
        <Box sx={{ display: 'flex', gap: '10px' }}>
          <Button onClick={onClose} color="inherit" sx={{ width: '100%' }}>Скасувати</Button>
          <Button onClick={handleSubmit((v) => submit(v).catch(() => undefined))} variant="contained" disabled={isSaving} sx={{ width: '100%' }}>
            Зберегти
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}
