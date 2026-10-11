import * as yup from 'yup';
import { toKopecks } from '../../../shared/api';

const amountPattern = /^\d{1,8}([.,]\d{1,2})?$/;

export const amountSchema = yup
  .string()
  .trim()
  .required("Обов'язкове поле")
  .matches(amountPattern, 'Невірна сума')
  .test('positive', 'Сума має бути більшою за 0', (value) => toKopecks(value ?? '') > 0);

export const optionalAmountSchema = yup
  .string()
  .trim()
  .default('')
  .test('amount', 'Невірна сума', (value) => !value || amountPattern.test(value));

export const allocationItemSchema = yup.object({
  chargeId: yup.string().required(),
  amount: optionalAmountSchema,
});
