import { createTheme } from '@mui/material/styles'
import { brandColors } from '../../shared/assets/brand'

const primaryDark = brandColors.orangeText
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
      contrastText: brandColors.inkOnOlive,
    },
    text: {
      primary: brandColors.ink,
      secondary: brandColors.muted,
    },
    background: {
      default: brandColors.ground,
      paper: brandColors.surface,
    },
    divider: brandColors.hairline,
    grey: {
      50: brandColors.tableHead,
      100: brandColors.navHover,
    },
  },
  typography: {
    fontFamily: '"Nunito", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 900 },
    h2: { fontWeight: 900 },
    h3: { fontWeight: 900 },
    h4: { fontWeight: 900 },
    h5: { fontWeight: 800 },
    h6: { fontWeight: 800 },
    button: { textTransform: 'none', fontWeight: 800 },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiPaper: {
      styleOverrides: {
        outlined: { border: 'none', boxShadow: brandColors.outline },
        elevation1: { boxShadow: brandColors.outline },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 20 },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 24 },
        paperFullScreen: { borderRadius: 0 },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 14, backgroundColor: brandColors.surface },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderBottomColor: brandColors.hairline },
        head: {
          fontSize: 12,
          fontWeight: 700,
          color: brandColors.muted,
          backgroundColor: brandColors.tableHead,
          textTransform: 'none',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        hover: { '&:hover': { backgroundColor: `${brandColors.hoverRow} !important` } },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 999, paddingInline: 18, minHeight: 44, fontWeight: 800 },
        sizeSmall: { minHeight: 40, paddingInline: 14 },
      },
      variants: [
        { props: { variant: 'text', color: 'primary' }, style: { color: primaryDark } },
        { props: { variant: 'outlined', color: 'primary' }, style: { color: primaryDark, borderColor: brandColors.orange } },
        { props: { variant: 'contained', color: 'primary' }, style: { color: brandColors.inkOnOrange } },
      ],
    },
    MuiIconButton: {
      variants: [{ props: { color: 'primary' }, style: { color: primaryDark } }],
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 999, fontWeight: 700 },
      },
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
          '&.Mui-selected': { color: theme.palette.text.primary },
        }),
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: ({ theme }) => ({ height: 3, borderRadius: 3, backgroundColor: theme.palette.primary.main }),
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          margin: '2px 10px',
          width: 'calc(100% - 20px)',
        },
      },
    },
  },
})
