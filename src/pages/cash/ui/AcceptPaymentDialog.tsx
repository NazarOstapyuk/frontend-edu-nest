import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Autocomplete, Box, Button, Dialog, DialogTitle, TextField, Typography } from '@mui/material'
import { childrenApi, type Child } from '../../../shared/api'
import { useIsPhone } from '../../../shared/lib/useIsPhone'
import { useCashStore } from '../model/cashStore'

const childName = (child: Child) => `${child.lastName} ${child.firstName}`

export const AcceptPaymentDialog = () => {
  const isPhone = useIsPhone()
  const navigate = useNavigate()
  const { isOpen, desk } = useCashStore((s) => s.acceptDialog)
  const setAcceptDialog = useCashStore((s) => s.setAcceptDialog)
  const [children, setChildren] = useState<Child[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [child, setChild] = useState<Child | null>(null)

  useEffect(() => {
    if (!isOpen || isLoaded) return
    childrenApi
      .getList()
      .then(({ data }) => setChildren([...data].sort((a, b) => childName(a).localeCompare(childName(b), 'uk'))))
      .catch(() => undefined)
      .finally(() => setIsLoaded(true))
  }, [isOpen, isLoaded])

  const handleClose = () => {
    setChild(null)
    setAcceptDialog({ isOpen: false, desk: null })
  }

  const handleNext = () => {
    if (!child || !desk) return
    const target = `/finance/${child.id}?pay=cash&desk=${desk.id}`
    handleClose()
    navigate(target)
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} fullWidth maxWidth="sm" fullScreen={isPhone}>
      <DialogTitle sx={{ fontWeight: 800 }}>Прийняти оплату</DialogTitle>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, px: '20px', pb: '20px' }}>
        <Typography variant="body2" color="text.secondary">
          Оберіть дитину. Відкриється її фінансова картка з формою оплати готівкою в касу «{desk?.name}».
        </Typography>
        <Autocomplete
          options={children}
          loading={!isLoaded}
          value={child}
          onChange={(_, selected) => setChild(selected)}
          getOptionLabel={childName}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          renderOption={(props, option) => {
            const { key, ...rest } = props
            return (
              <Box component="li" key={key} {...rest}>
                <Box>
                  <Typography>{childName(option)}</Typography>
                  {option.group && (
                    <Typography variant="body2" color="text.secondary">
                      {option.group.name}
                    </Typography>
                  )}
                </Box>
              </Box>
            )
          }}
          noOptionsText="Нікого не знайдено"
          loadingText="Завантаження…"
          renderInput={(params) => <TextField {...params} label="Дитина" autoFocus />}
        />
        <Box sx={{ display: 'flex', gap: '10px' }}>
          <Button onClick={handleClose} color="inherit" sx={{ width: '100%' }}>
            Скасувати
          </Button>
          <Button onClick={handleNext} variant="contained" disabled={!child} sx={{ width: '100%' }}>
            Далі
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}
