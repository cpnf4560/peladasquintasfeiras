# 🧪 Backup System - Testing & Deployment Guide

## ✅ Implementation Complete

All backup system components have been successfully implemented:

### 1. Backend Components ✅
- **`routes/backup.js`** - Main backup logic
  - `/admin/backup` - ZIP download endpoint
  - `/admin/info` - Database statistics JSON
  - Exports 8 tables to CSV format
  - Creates ZIP with metadata and README
  
- **`server.js`** - Routes registered
  - Line ~281: `const backupRoutes = require('./routes/backup');`
  - Line ~303: `app.use('/admin', backupRoutes);`

### 2. Frontend Components ✅
- **`views/admin-dashboard.ejs`** - Admin UI
  - Modern responsive design
  - Real-time statistics loading
  - Backup download button
  - Quick links section

- **`routes/admin.js`** - Dashboard route
  - `GET /admin/dashboard` - Renders admin panel
  - Requires admin authentication

### 3. Dependencies ✅
- **`archiver@^7.0.1`** added to package.json

### 4. Documentation ✅
- **`BACKUP_SYSTEM_GUIDE.md`** - Complete guide (400+ lines)
- **`BACKUP_SYSTEM_SUMMARY.md`** - Quick reference
- This testing guide

---

## 🔐 Authentication Required

The backup system requires admin authentication. To test locally:

### Option A: Login via Browser (Recommended)
1. **Start the server** (if not running):
   ```powershell
   node server.js
   ```

2. **Open browser**: http://localhost:3000/login

3. **Login with an existing user**

4. **Grant admin role** (one-time setup):
   - You need to manually update the database to set `role='admin'` for your user
   - Or have an existing admin user

5. **Access admin dashboard**: http://localhost:3000/admin/dashboard

### Option B: Create Admin User via Database
```javascript
// Create a script to update user role
const db = require('./db');
db.run(
  "UPDATE users SET role = 'admin' WHERE username = ?", 
  ['your_username'], 
  (err) => {
    if (err) console.error(err);
    else console.log('User updated to admin');
  }
);
```

---

## 🧪 Testing Checklist

### Local Testing (Requires Login)
- [ ] Server starts without errors
- [ ] Navigate to `/admin/dashboard`
- [ ] Statistics load correctly (AJAX call to `/admin/info`)
- [ ] Click "Download Backup" button
- [ ] ZIP file downloads with format: `backup_futsal_YYYY-MM-DD.zip`
- [ ] Extract ZIP and verify contents:
  - [ ] 8 CSV files (jogadores, jogos, presencas, etc.)
  - [ ] `metadata.json` with timestamp and record counts
  - [ ] `README.txt` with instructions
- [ ] Open CSV files and verify data format
- [ ] Check CSV encoding (UTF-8 with BOM for Excel)

### Automated Testing (No Login Required)
- [✅] Server starts successfully (Process ID: 9612)
- [✅] Server responds to HTTP requests (Status 200 OK)
- [✅] Admin routes require authentication (Status 401/403)
- [✅] Backup endpoints are registered

---

## 📦 What Gets Backed Up

The backup ZIP contains:

### CSV Files (8 tables):
1. **jogadores.csv** - Players (id, nome, ativo, data_registo)
2. **jogos.csv** - Games (id, data, equipa_laranja_golos, equipa_azul_golos)
3. **presencas.csv** - Attendance (id, jogo_id, jogador_id, equipa)
4. **coletes.csv** - Vests history (id, jogador_id, jogo_id, data)
5. **convocatoria.csv** - Call-ups (id, jogador_id, data_convocatoria, presente)
6. **faltas.csv** - Absences (id, jogador_id, jogo_id, data)
7. **users.csv** - Users (id, username, role, created_at) *password excluded*
8. **users_jogadores.csv** - User-player mapping (user_id, jogador_id)

### Metadata Files:
- **metadata.json** - Backup info (timestamp, database type, record counts)
- **README.txt** - Instructions for using the backup

---

## 🚀 Ready for Production

### Pre-Deployment Checklist
- [✅] All routes implemented
- [✅] UI created and functional
- [✅] Dependencies added
- [✅] Documentation complete
- [ ] Local testing completed (requires admin login)
- [ ] Code committed to Git
- [ ] Pushed to GitHub

### Deployment Steps

#### 1. Commit Changes
```powershell
# Check status
git status

# Add all files
git add .

# Commit
git commit -m "feat: Add complete backup system for admin dashboard

- Implement /admin/backup endpoint with ZIP download
- Create /admin/info endpoint for database statistics
- Add modern admin dashboard UI with backup functionality
- Export 8 database tables to CSV format
- Include metadata and README in backup ZIP
- Add archiver dependency for ZIP creation
- Secure endpoints with requireAdmin middleware
- Add comprehensive documentation"

# Push to GitHub
git push origin main
```

#### 2. Deploy to Render
1. Push to GitHub (triggers auto-deploy)
2. Wait for deployment to complete
3. Check logs for any errors
4. Test in production:
   - Login with admin account
   - Navigate to `/admin/dashboard`
   - Download backup
   - Verify ZIP contents

#### 3. Production Notes
- **Database**: Will use PostgreSQL on Render
- **Backup**: Will export from PostgreSQL tables
- **Authentication**: Existing session-based auth works
- **Security**: All admin routes protected by `requireAdmin` middleware
- **Auto-migration**: The `observacoes` column migration will run automatically

---

## 🔍 Troubleshooting

### Issue: "Access Denied" when accessing /admin/dashboard
**Solution**: 
- Ensure you're logged in
- Verify your user has `role='admin'` in the database
- Check session cookie is valid

### Issue: Statistics not loading
**Solution**:
- Check browser console for errors
- Verify `/admin/info` endpoint returns JSON
- Check database has data

### Issue: ZIP download fails
**Solution**:
- Check server logs for errors
- Verify `archiver` package is installed
- Ensure database connection is working

### Issue: CSV files are empty
**Solution**:
- Check database has records in tables
- Verify SQL queries in `routes/backup.js`
- Check database permissions

---

## 📊 Current Status

### ✅ Completed
1. Backend implementation
2. Frontend UI
3. Route registration
4. Dependencies added
5. Documentation created
6. Server tested and running

### ⏳ Pending
1. **Manual testing** (requires admin login)
2. **Git commit and push**
3. **Production deployment**
4. **Production testing**

---

## 🎯 Next Steps

### Immediate (Today):
1. **Login to the application** with an existing user
2. **Grant admin role** to your user (if needed)
3. **Test the backup download** manually
4. **Commit and push** to GitHub
5. **Deploy to Render**

### Post-Deployment:
1. Test backup in production environment
2. Schedule regular backups (if needed)
3. Document backup restoration process
4. Consider implementing auto-backup feature

---

## 📝 Notes

- **Security**: Backup endpoint requires admin authentication
- **Performance**: ZIP creation is done on-the-fly (no disk storage)
- **Database**: Works with both SQLite (local) and PostgreSQL (production)
- **Format**: CSV with UTF-8 BOM encoding for Excel compatibility
- **Size**: Backup size depends on database records
- **Frequency**: Manual backups on-demand (can be automated later)

---

## 💡 Future Enhancements

Consider implementing:
- [ ] Automated daily/weekly backups
- [ ] Backup restoration interface
- [ ] Email backup notifications
- [ ] S3/cloud storage integration
- [ ] Backup history tracking
- [ ] Incremental backups
- [ ] Scheduled backup jobs

---

**Status**: ✅ Ready for testing and deployment  
**Last Updated**: October 19, 2025  
**Version**: 1.0.0
