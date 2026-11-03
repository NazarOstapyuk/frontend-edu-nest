import { InputAdornment, TextField } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'

interface SearchFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export const SearchField = ({ value, onChange, placeholder = 'Пошук за ПІБ' }: SearchFieldProps) => (
  <TextField
    size="small"
    type="search"
    placeholder={placeholder}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    sx={{ minWidth: { xs: '100%', sm: 240 } }}
    slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
  />
)
