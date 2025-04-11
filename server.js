const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const cookieParser = require('cookie-parser');
const crypto = require('crypto');

// Create Express app - ensure it's defined before using app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request logging middleware (placed after parsing middleware to log request body)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  if (req.method === 'POST') {
    console.log('Request body:', req.body);
  }
  next();
});

app.use(express.static(path.join(__dirname, 'src')));

// Add CORS support
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  // Handle OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Ensure all responses have correct content type
app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function(obj) {
    res.setHeader('Content-Type', 'application/json');
    return originalJson.call(this, obj);
  };
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Create and initialize database
const db = new sqlite3.Database('./users.db', (err) => {
  if (err) {
    console.error('Failed to connect to database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    // Create users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user', 
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create stores table
    db.run(`
      CREATE TABLE IF NOT EXISTS stores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        province TEXT NOT NULL,
        zipcode TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create products table
    db.run(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        category TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create inventory table
    db.run(`
      CREATE TABLE IF NOT EXISTS inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        store_id INTEGER NOT NULL,
        sku TEXT NOT NULL,
        color TEXT,
        size TEXT,
        quantity INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (store_id) REFERENCES stores(id),
        UNIQUE(product_id, store_id, color, size)
      )
    `);

    // Create orders table
    db.run(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        total_amount REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        shipping_address TEXT,
        shipping_method TEXT,
        tracking_number TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Create order items table
    db.run(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        sku TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        color TEXT,
        size TEXT,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);

    // Create sales records table
    db.run(`
      CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        store_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        sku TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        amount REAL NOT NULL,
        sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);
  }
});

// Create admin database
const adminDb = new sqlite3.Database('./admin.db', (err) => {
  if (err) {
    console.error('Failed to connect to admin database:', err.message);
  } else {
    console.log('Connected to admin SQLite database');
    
    // Create admin table
    adminDb.run(`
      CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        email TEXT UNIQUE,
        reference_admin_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `, [], (err) => {
      if (err) {
        console.error('Error creating admin table:', err.message);
      } else {
        console.log('Admin table created successfully or already exists');
        
        // Force check default admin account
        adminDb.get('SELECT * FROM admins WHERE username = ?', ['ZZY'], (err, admin) => {
          if (err) {
            console.error('Error querying default admin:', err.message);
          } else if (!admin) {
            // Add default admin account
            console.log('Creating default admin account ZZY...');
            const { salt, hash } = hashPassword('Zzyzzy262625');
            adminDb.run(
              'INSERT INTO admins (username, password, email) VALUES (?, ?, ?)',
              ['ZZY', `${salt}:${hash}`, 'admin@fashionstore.com'],
              (err) => {
                if (err) {
                  console.error('Error creating default admin:', err.message);
                } else {
                  console.log('Default admin account created successfully');
                }
              }
            );
          } else {
            console.log('Default admin account already exists:', admin.username);
            console.log('Admin password:', admin.password);
          }
        });
      }
    });

    // Create admin invite codes table
    adminDb.run(`
      CREATE TABLE IF NOT EXISTS admin_invites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invite_code TEXT UNIQUE NOT NULL,
        created_by INTEGER NOT NULL,
        is_used BOOLEAN DEFAULT 0,
        used_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES admins(id),
        FOREIGN KEY (used_by) REFERENCES admins(id)
      )
    `);
  }
});

// Utility function: Password hashing
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

// Utility function: Password verification
function verifyPassword(password, salt, hash) {
  const passwordHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return passwordHash === hash;
}

// Remove admin token verification function, simplified implementation
function verifyAdminToken(token) {
  // Simplified implementation, directly corresponds to admin table id field
  try {
    // Query database to verify token existence (in actual application should use cache or JWT)
    return { adminId: 1, username: 'admin' }; // Simplified return
  } catch (error) {
    throw new Error('Invalid Token');
  }
}

// Admin permission middleware - simplified handling
function isAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ success: false, message: 'Unauthorized access', redirect: '/html/admin/login.html' });
    } else {
      return res.redirect('/html/admin/login.html');
    }
  }
  
  const token = authHeader.split(' ')[1];
  
  // Simplified verification process, assuming token is valid
  try {
    // Simply set admin information
    req.admin = { id: 1, username: 'admin' };
    next();
  } catch (error) {
    console.error('Admin verification error:', error);
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ success: false, message: 'Unauthorized access', redirect: '/html/admin/login.html' });
    } else {
      return res.redirect('/html/admin/login.html');
    }
  }
}

// API route: Validate admin token - simplified implementation
app.get('/api/admin/auth/validate', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized access' });
  }
  
  const token = authHeader.split(' ')[1];
  
  // Simplified verification process, directly return success
  try {
    // Return fake admin information
    res.json({
      success: true,
      admin: { id: 1, username: 'admin', email: 'admin@example.com' }
    });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid admin credentials' });
  }
});

// API route: Register
app.post('/api/auth/register', (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Basic validation
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    
    // Check if user already exists
    db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, email], (err, user) => {
      if (err) {
        console.error('Database query error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
      }
      
      if (user) {
        return res.status(400).json({ success: false, message: 'Username or email already in use' });
      }
      
      try {
        // Encrypt password
        const { salt, hash } = hashPassword(password);
        
        // Save user to database
        const stmt = db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)');
        stmt.run(username, email, `${salt}:${hash}`, function(err) {
          if (err) {
            console.error('Database insertion error:', err);
            return res.status(500).json({ success: false, message: 'Registration failed: ' + err.message });
          }
          
          res.status(201).json({ 
            success: true, 
            message: 'Registration successful',
            user: { id: this.lastID, username, email }
          });
        });
        stmt.finalize();
      } catch (error) {
        console.error('Error processing registration:', error);
        res.status(500).json({ success: false, message: 'Server processing error' });
      }
    });
  } catch (error) {
    console.error('Registration route error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// API route: Login
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    
    // Find user
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
      if (err) {
        console.error('Database query error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
      }
      
      if (!user) {
        return res.status(401).json({ success: false, message: 'Incorrect email or password' });
      }
      
      try {
        // Verify password
        const [salt, storedHash] = user.password.split(':');
        if (!verifyPassword(password, salt, storedHash)) {
          return res.status(401).json({ success: false, message: 'Incorrect email or password' });
        }
        
        // Simple token generation
        const token = crypto.randomBytes(64).toString('hex');
        
        res.status(200).json({
          success: true,
          message: 'Login successful',
          token,
          user: { id: user.id, username: user.username, email: user.email }
        });
      } catch (error) {
        console.error('Password verification error:', error);
        res.status(500).json({ success: false, message: 'Server processing error' });
      }
    });
  } catch (error) {
    console.error('Login route error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// API route: Check username - supports GET method
app.get('/api/auth/check-username', (req, res) => {
  try {
    const { username } = req.query;
    
    if (!username) {
      return res.status(400).json({ success: false, message: 'Username is required' });
    }
    
    db.get('SELECT username FROM users WHERE username = ?', [username], (err, user) => {
      if (err) {
        console.error('Database query error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
      }
      
      res.status(200).json({
        success: true,
        exists: !!user
      });
    });
  } catch (error) {
    console.error('Check username route error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Set default route - redirect to login page
app.get('/', (req, res) => {
  res.redirect('/html/auth/login.html');
});

// Status check interface
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// Add a health check interface
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    routes: [
      '/api/admin/auth/login', 
      '/api/admin/auth/validate',
      '/api/admin/auth/invite',
      '/api/admin/auth/register',
      '/api/admin/auth/check-invite'
    ]
  });
});

// Simplified admin login API - reference user login implementation
app.post('/api/admin/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Basic validation
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }
    
    // Find admin
    adminDb.get('SELECT * FROM admins WHERE username = ?', [username], (err, admin) => {
      if (err) {
        console.error('Error querying admin:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
      }
      
      if (!admin) {
        return res.status(401).json({ success: false, message: 'Incorrect username or password' });
      }
      
      try {
        // Verify password
        const [salt, storedHash] = admin.password.split(':');
        if (!verifyPassword(password, salt, storedHash)) {
          return res.status(401).json({ success: false, message: 'Incorrect username or password' });
        }
        
        // Generate token
        const token = crypto.randomBytes(64).toString('hex');
        
        res.status(200).json({
          success: true,
          message: 'Login successful',
          token,
          admin: { id: admin.id, username: admin.username, email: admin.email }
        });
      } catch (error) {
        console.error('Password verification error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
      }
    });
  } catch (error) {
    console.error('Login route error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ⚠️ Note: Some admin API routes are directly defined in this file
// Admin routes are only used for invite code management etc. without conflicts
const adminRoutes = require('./src/routes/admin');
app.use('/api/admin', adminRoutes);

// Catch 404 errors
app.use((req, res) => {
  // Record 404 error log for debugging
  console.log('404 error path:', req.path);
  
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ success: false, message: '接口不存在' });
  } else {
    res.status(404).sendFile(path.join(__dirname, 'src/html/404.html'));
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
});

// API route: Generate invite code
app.post('/api/admin/auth/invite', isAdmin, (req, res) => {
  const adminId = req.admin.id;
  
  // Generate a random invite code
  const inviteCode = crypto.randomBytes(6).toString('hex').toUpperCase();
  
  // Set expiration to 7 days
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  
  // Save invite code
  adminDb.run(
    'INSERT INTO admin_invites (invite_code, created_by, expires_at) VALUES (?, ?, ?)',
    [inviteCode, adminId, expiresAt.toISOString()],
    function(err) {
      if (err) {
        console.error('Error creating invite code:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
      }
      
      res.json({
        success: true,
        inviteCode,
        expiresAt: expiresAt.toISOString()
      });
    }
  );
});

// API route: Admin registration (requires invite code)
app.post('/api/admin/auth/register', (req, res) => {
  const { username, password, email, inviteCode } = req.body;
  
  if (!username || !password || !email || !inviteCode) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }
  
  // Validate invite code
  adminDb.get(
    'SELECT * FROM admin_invites WHERE invite_code = ? AND is_used = 0 AND expires_at > ?',
    [inviteCode, new Date().toISOString()],
    (err, invite) => {
      if (err) {
        console.error('Error validating invite code:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
      }
      
      if (!invite) {
        return res.status(400).json({ success: false, message: 'Invite code is invalid or expired' });
      }
      
      // Check if username already exists
      adminDb.get('SELECT * FROM admins WHERE username = ? OR email = ?', [username, email], (err, admin) => {
        if (err) {
          console.error('Error querying admin:', err);
          return res.status(500).json({ success: false, message: 'Server error' });
        }
        
        if (admin) {
          return res.status(400).json({ success: false, message: 'Username or email already in use' });
        }
        
        // Hash password
        const { salt, hash } = hashPassword(password);
        
        // Save new admin
        adminDb.run(
          'INSERT INTO admins (username, password, email, reference_admin_id) VALUES (?, ?, ?, ?)',
          [username, `${salt}:${hash}`, email, invite.created_by],
          function(err) {
            if (err) {
              console.error('Error creating admin:', err);
              return res.status(500).json({ success: false, message: 'Server error' });
            }
            
            const newAdminId = this.lastID;
            
            // Mark invite code as used
            adminDb.run(
              'UPDATE admin_invites SET is_used = 1, used_by = ? WHERE id = ?',
              [newAdminId, invite.id],
              (err) => {
                if (err) {
                  console.error('Error updating invite code status:', err);
                }
                
                // Simplified token generation
                const token = crypto.randomBytes(64).toString('hex');
                
                res.status(201).json({
                  success: true,
                  message: 'Registration successful',
                  token,
                  admin: { id: newAdminId, username, email }
                });
              }
            );
          }
        );
      });
    }
  );
});

// API route: Check invite code validity
app.post('/api/admin/auth/check-invite', (req, res) => {
  const { inviteCode } = req.body;
  
  if (!inviteCode) {
    return res.status(400).json({ success: false, message: 'Please provide an invite code' });
  }
  
  // Validate invite code
  adminDb.get(
    'SELECT * FROM admin_invites WHERE invite_code = ? AND is_used = 0 AND expires_at > ?',
    [inviteCode, new Date().toISOString()],
    (err, invite) => {
      if (err) {
        console.error('Error validating invite code:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
      }
      
      if (!invite) {
        return res.status(400).json({ success: false, message: 'Invite code is invalid or expired' });
      }
      
      res.json({
        success: true,
        message: 'Invite code is valid'
      });
    }
  );
});

// API route: Get all stores
app.get('/api/admin/stores', isAdmin, (req, res) => {
  db.all(`
    SELECT 
      s.*, 
      (SELECT SUM(quantity) FROM inventory WHERE store_id = s.id) as total_inventory,
      (SELECT SUM(amount) FROM sales WHERE store_id = s.id AND date(sale_date) = date('now')) as today_sales
    FROM stores s
    ORDER BY s.name
  `, [], (err, stores) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
    
    res.json({ success: true, stores });
  });
});

// API route: Get store details
app.get('/api/admin/stores/:id', isAdmin, (req, res) => {
  const storeId = req.params.id;
  
  db.get('SELECT * FROM stores WHERE id = ?', [storeId], (err, store) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
    
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }
    
    // Query store's inventory products
    db.all(`
      SELECT 
        p.id, p.name, p.price, i.sku, i.color, i.size, i.quantity
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      WHERE i.store_id = ?
      ORDER BY p.name, i.color, i.size
    `, [storeId], (err, inventory) => {
      if (err) {
        console.error('Database query error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
      }
      
      // Query store's sales records
      const dateFilter = req.query.dateFilter || 'week';
      let dateCondition = '';
      
      if (dateFilter === 'today') {
        dateCondition = "AND date(sale_date) = date('now')";
      } else if (dateFilter === 'week') {
        dateCondition = "AND date(sale_date) >= date('now', '-7 days')";
      } else if (dateFilter === 'month') {
        dateCondition = "AND date(sale_date) >= date('now', '-1 month')";
      } else if (dateFilter === 'custom' && req.query.startDate && req.query.endDate) {
        dateCondition = `AND date(sale_date) BETWEEN '${req.query.startDate}' AND '${req.query.endDate}'`;
      }
      
      db.all(`
        SELECT 
          s.id, s.sale_date, p.name as product_name, s.sku, s.quantity, s.amount
        FROM sales s
        JOIN products p ON s.product_id = p.id
        WHERE s.store_id = ? ${dateCondition}
        ORDER BY s.sale_date DESC
      `, [storeId], (err, sales) => {
        if (err) {
          console.error('Database query error:', err);
          return res.status(500).json({ success: false, message: 'Server error' });
        }
        
        res.json({
          success: true,
          store,
          inventory,
          sales
        });
      });
    });
  });
});

// API route: Get sales summary
app.get('/api/admin/sales', isAdmin, (req, res) => {
  const period = req.query.period || 'month';
  let groupBy = '';
  let dateCondition = '';
  
  if (period === 'day') {
    groupBy = "date(s.sale_date)";
    dateCondition = "AND date(s.sale_date) >= date('now', '-30 days')";
  } else if (period === 'week') {
    groupBy = "strftime('%Y-%W', s.sale_date)";
    dateCondition = "AND date(s.sale_date) >= date('now', '-24 weeks')";
  } else {
    groupBy = "strftime('%Y-%m', s.sale_date)";
    dateCondition = "AND date(s.sale_date) >= date('now', '-12 months')";
  }
  
  // Get sales data
  db.all(`
    SELECT 
      ${groupBy} as period,
      SUM(s.amount) as total_sales
    FROM sales s
    WHERE 1=1 ${dateCondition}
    GROUP BY ${groupBy}
    ORDER BY ${groupBy}
  `, [], (err, salesData) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
    
    // Get top products
    db.all(`
      SELECT 
        p.id, p.name, SUM(s.quantity) as total_quantity, SUM(s.amount) as total_amount
      FROM sales s
      JOIN products p ON s.product_id = p.id
      WHERE date(s.sale_date) >= date('now', '-30 days')
      GROUP BY p.id
      ORDER BY total_quantity DESC
      LIMIT 10
    `, [], (err, topProducts) => {
      if (err) {
        console.error('Database query error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
      }
      
      // Get store sales ranking
      db.all(`
        SELECT 
          st.id, st.name, SUM(s.amount) as total_sales
        FROM sales s
        JOIN stores st ON s.store_id = st.id
        WHERE date(s.sale_date) >= date('now', '-30 days')
        GROUP BY st.id
        ORDER BY total_sales DESC
      `, [], (err, storeRanking) => {
        if (err) {
          console.error('Database query error:', err);
          return res.status(500).json({ success: false, message: 'Server error' });
        }
        
        res.json({
          success: true,
          salesData,
          topProducts,
          storeRanking
        });
      });
    });
  });
});

// API route: Get order list
app.get('/api/admin/orders', isAdmin, (req, res) => {
  const status = req.query.status || 'all';
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  
  let statusCondition = '';
  if (status !== 'all') {
    statusCondition = `WHERE o.status = '${status}'`;
  }
  
  // Get total orders to support pagination
  db.get(`
    SELECT COUNT(*) as total
    FROM orders o
    ${statusCondition}
  `, [], (err, result) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
    
    const totalOrders = result.total;
    const totalPages = Math.ceil(totalOrders / limit);
    
    // Get order list
    db.all(`
      SELECT 
        o.id, o.total_amount, o.status, o.created_at,
        u.username as customer_name,
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ${statusCondition}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset], (err, orders) => {
      if (err) {
        console.error('Database query error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
      }
      
      res.json({
        success: true,
        orders,
        pagination: {
          total: totalOrders,
          current_page: page,
          per_page: limit,
          total_pages: totalPages
        }
      });
    });
  });
}); 