import { formatMoney, toKopecks } from '../../../shared/api';
import { brandColors } from '../../../shared/assets/brand';

export const formatKopecks = (kopecks: number) => formatMoney(kopecks / 100);

export const signedKopecks = (kopecks: number) => {
  if (kopecks === 0) return formatKopecks(0);
  return `${kopecks > 0 ? '+' : '−'}${formatKopecks(Math.abs(kopecks))}`;
};

export const signedMoney = (value: string, sign: number) => signedKopecks(toKopecks(value) * sign);

export const differenceInfo = (kopecks: number) => {
  if (kopecks === 0) return { text: 'Без розбіжностей', color: 'text.secondary' };
  if (kopecks < 0) return { text: `Нестача ${formatKopecks(-kopecks)}`, color: brandColors.debt };
  return { text: `Надлишок ${formatKopecks(kopecks)}`, color: brandColors.partialText };
};
