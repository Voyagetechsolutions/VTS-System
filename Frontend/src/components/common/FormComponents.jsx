import React from 'react';
import {
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Chip,
  Autocomplete,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  Switch,
  alpha,
  InputAdornment,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import { Visibility, VisibilityOff, Search as SearchIcon } from '@mui/icons-material';
import { Icon } from './IconMap';
import theme from '../../styles/theme';

// Modern text field with consistent styling
export const ModernTextField = ({ 
  variant = 'outlined',
  size = 'medium',
  fullWidth = true,
  ...props 
}) => (
  <TextField
    variant={variant}
    size={size}
    fullWidth={fullWidth}
    sx={{
      '& .MuiOutlinedInput-root': {
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.background.primary,
        transition: theme.transitions.fast,
        '&:hover': {
          backgroundColor: alpha(theme.colors.primary[50], 0.5),
        },
        '&.Mui-focused': {
          backgroundColor: theme.colors.background.primary,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.colors.primary[500],
            borderWidth: 2,
          },
        },
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: theme.colors.border.medium,
        },
      },
      '& .MuiInputLabel-root': {
        color: theme.colors.text.secondary,
        '&.Mui-focused': {
          color: theme.colors.primary[600],
        },
      },
    }}
    {...props}
  />
);

// Search field with icon
export const SearchField = ({ 
  placeholder = 'Search...', 
  value, 
  onChange, 
  onClear,
  ...props 
}) => (
  <ModernTextField
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    InputProps={{
      startAdornment: (
        <InputAdornment position="start">
          <SearchIcon sx={{ color: theme.colors.text.muted }} />
        </InputAdornment>
      ),
      endAdornment: value && onClear && (
        <InputAdornment position="end">
          <IconButton onClick={onClear} size="small">
            <Icon name="close" size={16} />
          </IconButton>
        </InputAdornment>
      ),
    }}
    {...props}
  />
);

// Password field with toggle visibility
export const PasswordField = ({ ...props }) => {
  const [showPassword, setShowPassword] = React.useState(false);
  
  return (
    <ModernTextField
      type={showPassword ? 'text' : 'password'}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              onClick={() => setShowPassword(!showPassword)}
              edge="end"
              size="small"
            >
              {showPassword ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </InputAdornment>
        ),
      }}
      {...props}
    />
  );
};

// Modern select with consistent styling
export const ModernSelect = ({ 
  label, 
  value, 
  onChange, 
  options = [], 
  placeholder,
  error,
  helperText,
  fullWidth = true,
  ...props 
}) => (
  <FormControl fullWidth={fullWidth} error={error}>
    <InputLabel sx={{ color: theme.colors.text.secondary }}>
      {label}
    </InputLabel>
    <Select
      value={value}
      onChange={onChange}
      label={label}
      displayEmpty={!!placeholder}
      sx={{
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.background.primary,
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: theme.colors.border.medium,
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: theme.colors.primary[400],
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: theme.colors.primary[500],
          borderWidth: 2,
        },
      }}
      {...props}
    >
      {placeholder && (
        <MenuItem value="" disabled>
          <em>{placeholder}</em>
        </MenuItem>
      )}
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.icon && <Icon name={option.icon} size={16} />}
          <Box sx={{ ml: option.icon ? 1 : 0 }}>{option.label}</Box>
        </MenuItem>
      ))}
    </Select>
    {helperText && <FormHelperText>{helperText}</FormHelperText>}
  </FormControl>
);

// Multi-select with chips
export const ChipSelect = ({ 
  label, 
  value = [], 
  onChange, 
  options = [], 
  placeholder,
  ...props 
}) => (
  <Autocomplete
    multiple
    value={value}
    onChange={(_, newValue) => onChange(newValue)}
    options={options}
    getOptionLabel={(option) => option.label}
    renderTags={(value, getTagProps) =>
      value.map((option, index) => (
        <Chip
          label={option.label}
          {...getTagProps({ index })}
          size="small"
          sx={{
            backgroundColor: alpha(theme.colors.primary[500], 0.1),
            color: theme.colors.primary[700],
            '& .MuiChip-deleteIcon': {
              color: theme.colors.primary[600],
            },
          }}
        />
      ))
    }
    renderInput={(params) => (
      <ModernTextField
        {...params}
        label={label}
        placeholder={placeholder}
      />
    )}
    sx={{
      '& .MuiAutocomplete-paper': {
        borderRadius: theme.borderRadius.lg,
        boxShadow: theme.shadows.lg,
      },
    }}
    {...props}
  />
);

// Modern button with variants
export const ModernButton = ({ 
  variant = 'contained', 
  color = 'primary',
  size = 'medium',
  icon,
  loading,
  children,
  ...props 
}) => (
  <Button
    variant={variant}
    color={color}
    size={size}
    disabled={loading}
    startIcon={icon && <Icon name={icon} size={18} />}
    sx={{
      borderRadius: theme.borderRadius.md,
      textTransform: 'none',
      fontWeight: theme.typography.fontWeight.semibold,
      boxShadow: variant === 'contained' ? theme.shadows.sm : 'none',
      transition: theme.transitions.fast,
      '&:hover': {
        transform: 'translateY(-1px)',
        boxShadow: variant === 'contained' ? theme.shadows.md : 'none',
      },
      '&:active': {
        transform: 'translateY(0)',
      },
    }}
    {...props}
  >
    {loading ? 'Loading...' : children}
  </Button>
);

// Icon button with tooltip
export const IconButtonWithTooltip = ({ 
  icon, 
  tooltip, 
  size = 'medium',
  onClick,
  ...props 
}) => (
  <Tooltip title={tooltip} arrow>
    <IconButton
      onClick={onClick}
      size={size}
      sx={{
        color: theme.colors.text.secondary,
        borderRadius: theme.borderRadius.sm,
        transition: theme.transitions.fast,
        '&:hover': {
          backgroundColor: alpha(theme.colors.primary[500], 0.1),
          color: theme.colors.primary[600],
        },
      }}
      {...props}
    >
      <Icon name={icon} size={size === 'small' ? 16 : 20} />
    </IconButton>
  </Tooltip>
);

// Form section with title
export const FormSection = ({ title, subtitle, children, ...props }) => (
  <Box sx={{ mb: 3 }} {...props}>
    {title && (
      <Box sx={{ mb: 2 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.text.primary,
            mb: subtitle ? 0.5 : 0,
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            variant="body2"
            sx={{ color: theme.colors.text.secondary }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>
    )}
    {children}
  </Box>
);

// Form row with responsive layout
export const FormRow = ({ children, spacing = 2, ...props }) => (
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: {
        xs: '1fr',
        sm: 'repeat(auto-fit, minmax(250px, 1fr))',
      },
      gap: spacing,
      mb: 2,
    }}
    {...props}
  >
    {children}
  </Box>
);

// Checkbox with modern styling
export const ModernCheckbox = ({ label, ...props }) => (
  <FormControlLabel
    control={
      <Checkbox
        sx={{
          color: theme.colors.border.medium,
          '&.Mui-checked': {
            color: theme.colors.primary[600],
          },
          '&:hover': {
            backgroundColor: alpha(theme.colors.primary[500], 0.1),
          },
        }}
        {...props}
      />
    }
    label={
      <Typography
        variant="body2"
        sx={{ color: theme.colors.text.primary }}
      >
        {label}
      </Typography>
    }
  />
);

// Switch with modern styling
export const ModernSwitch = ({ label, ...props }) => (
  <FormControlLabel
    control={
      <Switch
        sx={{
          '& .MuiSwitch-switchBase.Mui-checked': {
            color: theme.colors.primary[600],
            '&:hover': {
              backgroundColor: alpha(theme.colors.primary[600], 0.08),
            },
          },
          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
            backgroundColor: theme.colors.primary[600],
          },
        }}
        {...props}
      />
    }
    label={
      <Typography
        variant="body2"
        sx={{ color: theme.colors.text.primary }}
      >
        {label}
      </Typography>
    }
  />
);

// Radio group with modern styling
export const ModernRadioGroup = ({ 
  label, 
  value, 
  onChange, 
  options = [], 
  row = false,
  ...props 
}) => (
  <FormControl component="fieldset">
    {label && (
      <Typography
        variant="subtitle2"
        sx={{
          mb: 1,
          color: theme.colors.text.primary,
          fontWeight: theme.typography.fontWeight.medium,
        }}
      >
        {label}
      </Typography>
    )}
    <RadioGroup
      value={value}
      onChange={onChange}
      row={row}
      {...props}
    >
      {options.map((option) => (
        <FormControlLabel
          key={option.value}
          value={option.value}
          control={
            <Radio
              sx={{
                color: theme.colors.border.medium,
                '&.Mui-checked': {
                  color: theme.colors.primary[600],
                },
                '&:hover': {
                  backgroundColor: alpha(theme.colors.primary[500], 0.1),
                },
              }}
            />
          }
          label={
            <Typography
              variant="body2"
              sx={{ color: theme.colors.text.primary }}
            >
              {option.label}
            </Typography>
          }
        />
      ))}
    </RadioGroup>
  </FormControl>
);

export default {
  ModernTextField,
  SearchField,
  PasswordField,
  ModernSelect,
  ChipSelect,
  ModernButton,
  IconButtonWithTooltip,
  FormSection,
  FormRow,
  ModernCheckbox,
  ModernSwitch,
  ModernRadioGroup,
};
