#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// List of files and their fixes
const fixes = [
  // Remove unused imports
  {
    file: 'src/components/companyAdmin/components/AssignModal.jsx',
    changes: [
      {
        from: 'import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControl, InputLabel, Select, MenuItem, Typography } from \'@mui/material\';',
        to: 'import { Dialog, DialogTitle, DialogContent, DialogActions, Button, FormControl, InputLabel, Select, MenuItem, Typography } from \'@mui/material\';'
      }
    ]
  },
  {
    file: 'src/components/companyAdmin/components/ShiftTable.jsx',
    changes: [
      {
        from: 'import {\n  Edit as EditIcon, Delete as DeleteIcon, Visibility as VisibilityIcon\n} from \'@mui/icons-material\';',
        to: 'import {\n  Edit as EditIcon, Delete as DeleteIcon\n} from \'@mui/icons-material\';'
      },
      {
        from: 'const ShiftTable = ({ data, loading }) => {',
        to: 'const ShiftTable = ({ data }) => {'
      },
      {
        from: '  const companyId = window.companyId || localStorage.getItem(\'companyId\');',
        to: '  // const companyId = window.companyId || localStorage.getItem(\'companyId\'); // TODO: Use for API calls'
      },
      {
        from: '  const formatTime = (timeString) => {',
        to: '  // const formatTime = (timeString) => { // TODO: Implement time formatting'
      }
    ]
  }
];

// Function to apply fixes
function applyFixes() {
  console.log('🔧 Applying ESLint fixes...');
  
  fixes.forEach(({ file, changes }) => {
    const filePath = path.join(__dirname, file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${file}`);
      return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    changes.forEach(({ from, to }) => {
      if (content.includes(from)) {
        content = content.replace(from, to);
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${file}`);
    }
  });
  
  console.log('🎉 ESLint fixes applied!');
}

if (require.main === module) {
  applyFixes();
}

module.exports = { applyFixes };
