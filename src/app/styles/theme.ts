import { createTheme } from '@mui/material/styles'
import { brandColors } from '../../shared/assets/brand'

const primaryDark = '#C25A1C'
const secondaryDark = '#6C6D4F'

export const theme = createTheme({
  palette: {
    primary: {
      main: brandColors.orange,
      light: '#F7A877',
      dark: primaryDark,
      contrastText: brandColors.inkOnOrange,
    },
    secondary: {
      main: brandColors.olive,
      light: '#C6C7AB',
      dark: secondaryDark,
      contrastText: '#23241A',
    },
    text: {
      primary: brandColors.ink,
      secondary: '#6A6958',
    },
    background: {
      default: '#F4F4EE',
      paper: '#ffffff',
    },
    divider: 'rgba(74, 76, 54, 0.14)',
    grey: {
      50: '#F1F2EA',
      100: '#E7E8DC',
    },
  },
  typography: {
    fontFamily: '"Nunito", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 800 },
    h5: { fontWeight: 800 },
    h6: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 700 },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 999, paddingInline: 18 },
      },
      variants: [
        { props: { variant: 'text', color: 'primary' }, style: { color: primaryDark } },
        { props: { variant: 'outlined', color: 'primary' }, style: { color: primaryDark, borderColor: brandColors.orange } },
      ],
    },
    MuiIconButton: {
      variants: [{ props: { color: 'primary' }, style: { color: primaryDark } }],
    },
    MuiChip: {
      variants: [
        { props: { variant: 'outlined', color: 'primary' }, style: { color: primaryDark } },
        { props: { variant: 'outlined', color: 'secondary' }, style: { color: secondaryDark } },
      ],
    },
    MuiLink: {
      styleOverrides: {
        root: ({ theme }) => ({ color: theme.palette.primary.dark }),
      },
    },
    MuiTab: {
      styleOverrides: {
        root: ({ theme }) => ({
          textTransform: 'none',
          fontWeight: 700,
          '&.Mui-selected': { color: theme.palette.primary.dark },
        }),
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: { height: 3, borderRadius: 3 },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          margin: '2px 10px',
          width: 'calc(100% - 20px)',
        },
      },
    },
  },
})
