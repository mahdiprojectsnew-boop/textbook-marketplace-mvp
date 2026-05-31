-- ============================================================
-- TEXTBOOK MARKETPLACE — COMPLETE DATABASE MIGRATION
-- MVP Master Plan v3
-- Run this entire script in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLE: cities
-- ============================================================
CREATE TABLE IF NOT EXISTS cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(name, state)
);

-- ============================================================
-- TABLE: universities
-- ============================================================
CREATE TABLE IF NOT EXISTS universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  city_id UUID REFERENCES cities(id) ON DELETE SET NULL,
  state TEXT,
  website TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  source TEXT NOT NULL DEFAULT 'admin' CHECK (source IN ('excel', 'admin', 'user_suggestion')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: departments
-- ============================================================
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  source TEXT NOT NULL DEFAULT 'admin' CHECK (source IN ('excel', 'admin', 'user_suggestion')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(university_id, name)
);

-- ============================================================
-- TABLE: professors
-- ============================================================
CREATE TABLE IF NOT EXISTS professors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  source TEXT NOT NULL DEFAULT 'admin' CHECK (source IN ('excel', 'admin', 'user_suggestion')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: courses
-- ============================================================
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  source TEXT NOT NULL DEFAULT 'admin' CHECK (source IN ('excel', 'admin', 'user_suggestion')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: books
-- ============================================================
CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  author TEXT,
  isbn TEXT UNIQUE,
  edition TEXT,
  publisher TEXT,
  year INT,
  cover_image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  source TEXT NOT NULL DEFAULT 'admin' CHECK (source IN ('excel', 'admin', 'user_suggestion')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: admin_users
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT CHECK (role IN ('student', 'faculty')),
  is_academic_verified BOOLEAN NOT NULL DEFAULT false,
  academic_email TEXT,
  academic_verified_at TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_account_id TEXT,
  average_rating NUMERIC(3,2),
  total_reviews INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: user_academic_profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS user_academic_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  university_id UUID REFERENCES universities(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- ============================================================
-- TABLE: user_courses
-- ============================================================
CREATE TABLE IF NOT EXISTS user_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  professor_id UUID REFERENCES professors(id) ON DELETE SET NULL,
  semester TEXT,
  year INT,
  UNIQUE(user_id, course_id, professor_id)
);

-- ============================================================
-- TABLE: academic_book_links
-- ============================================================
CREATE TABLE IF NOT EXISTS academic_book_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id UUID NOT NULL REFERENCES professors(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  semester TEXT,
  year INT,
  link_type TEXT NOT NULL DEFAULT 'required' CHECK (link_type IN ('required', 'recommended')),
  submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  source TEXT NOT NULL DEFAULT 'user_suggestion' CHECK (source IN ('excel', 'admin', 'user_suggestion')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(professor_id, course_id, book_id, semester, year)
);

-- ============================================================
-- TABLE: listings
-- ============================================================
CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE RESTRICT,
  professor_id UUID REFERENCES professors(id) ON DELETE SET NULL,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  university_id UUID REFERENCES universities(id) ON DELETE SET NULL,
  listing_type TEXT NOT NULL CHECK (listing_type IN ('sale', 'rental')),
  condition TEXT NOT NULL CHECK (condition IN ('like_new', 'very_good', 'good', 'fair', 'poor')),
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  suggested_price NUMERIC(10,2),
  deposit_amount NUMERIC(10,2),
  rental_duration_days INT,
  rental_end_date DATE,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'rented', 'sold', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: listing_images
-- ============================================================
CREATE TABLE IF NOT EXISTS listing_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  s3_key TEXT NOT NULL,
  image_url TEXT NOT NULL,
  image_type TEXT NOT NULL DEFAULT 'other' CHECK (
    image_type IN ('front_cover', 'back_cover', 'interior', 'damage', 'other')
  ),
  sort_order INT NOT NULL DEFAULT 0,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: transactions
-- STATUS FLOW:
--   Purchase: pending → active → exchange_pending → meeting_confirmed
--             → book_received → completed
--   Rental:   pending → active → exchange_pending → meeting_confirmed
--             → book_received → return_pending → completed | disputed
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE RESTRICT,
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'rental')),

  -- Payment
  amount NUMERIC(10,2) CHECK (amount >= 0),
  platform_fee NUMERIC(10,2) CHECK (platform_fee >= 0),
  deposit_amount NUMERIC(10,2) CHECK (deposit_amount >= 0),
  stripe_payment_intent_id TEXT,
  stripe_deposit_payment_intent_id TEXT,
  stripe_transfer_id TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'active',
    'exchange_pending',
    'meeting_confirmed',
    'book_received',
    'completed',
    'return_pending',
    'disputed',
    'cancelled',
    'refunded',
    'deposit_refunded',
    'deposit_captured'
  )),

  -- Exchange coordination
  meeting_confirmed_at TIMESTAMPTZ,
  meeting_confirmed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  book_received_at TIMESTAMPTZ,
  book_received_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Rental lifecycle
  rental_start_date DATE,
  rental_end_date DATE,
  actual_return_date DATE,
  return_confirmed_by_renter BOOLEAN NOT NULL DEFAULT false,
  return_confirmed_by_lender BOOLEAN NOT NULL DEFAULT false,
  return_condition TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: transaction_status_log
-- Immutable audit trail — never update or delete rows
-- ============================================================
CREATE TABLE IF NOT EXISTS transaction_status_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN (
    'user_action',
    'system',
    'admin',
    'payment_event'
  )),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: reviews
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  overall_rating INT NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  communication_rating INT CHECK (communication_rating BETWEEN 1 AND 5),
  reliability_rating INT CHECK (reliability_rating BETWEEN 1 AND 5),
  accuracy_rating INT CHECK (accuracy_rating BETWEEN 1 AND 5),
  written_review TEXT,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(transaction_id, reviewer_id)
);

-- ============================================================
-- TABLE: disputes
-- ============================================================
CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  opened_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
    'open', 'evidence_collection', 'under_review', 'resolved', 'closed'
  )),
  deposit_status TEXT NOT NULL DEFAULT 'frozen' CHECK (deposit_status IN (
    'frozen', 'released', 'partially_captured', 'fully_captured'
  )),
  admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  admin_decision TEXT,
  admin_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: dispute_evidence
-- ============================================================
CREATE TABLE IF NOT EXISTS dispute_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_url TEXT,
  s3_key TEXT,
  file_type TEXT,
  description TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: messages
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_flagged BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT,
  body TEXT,
  related_entity_type TEXT,
  related_entity_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  email_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: suggestions
-- ============================================================
CREATE TABLE IF NOT EXISTS suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  suggestion_type TEXT NOT NULL CHECK (suggestion_type IN (
    'university', 'department', 'professor', 'course', 'book', 'book_course_link'
  )),
  payload JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'rejected', 'edited'
  )),
  admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  admin_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: excel_import_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS excel_import_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  imported_by UUID NOT NULL REFERENCES admin_users(id) ON DELETE RESTRICT,
  file_name TEXT,
  s3_key TEXT,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  summary JSONB,
  errors JSONB,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: watchlist
-- ============================================================
CREATE TABLE IF NOT EXISTS watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('professor', 'course', 'book', 'search')),
  entity_id UUID,
  search_query JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, entity_type, entity_id)
);

-- ============================================================
-- INDEXES
-- ============================================================

-- cities
CREATE INDEX IF NOT EXISTS idx_cities_state ON cities(state);

-- universities
CREATE INDEX IF NOT EXISTS idx_universities_city_id ON universities(city_id);
CREATE INDEX IF NOT EXISTS idx_universities_state ON universities(state);
CREATE INDEX IF NOT EXISTS idx_universities_is_active ON universities(is_active);
CREATE INDEX IF NOT EXISTS idx_universities_slug ON universities(slug);

-- departments
CREATE INDEX IF NOT EXISTS idx_departments_university_id ON departments(university_id);
CREATE INDEX IF NOT EXISTS idx_departments_is_active ON departments(is_active);

-- professors
CREATE INDEX IF NOT EXISTS idx_professors_university_id ON professors(university_id);
CREATE INDEX IF NOT EXISTS idx_professors_department_id ON professors(department_id);
CREATE INDEX IF NOT EXISTS idx_professors_last_name ON professors(last_name);
CREATE INDEX IF NOT EXISTS idx_professors_is_active ON professors(is_active);
CREATE INDEX IF NOT EXISTS idx_professors_name ON professors(last_name, first_name);

-- courses
CREATE INDEX IF NOT EXISTS idx_courses_university_id ON courses(university_id);
CREATE INDEX IF NOT EXISTS idx_courses_department_id ON courses(department_id);
CREATE INDEX IF NOT EXISTS idx_courses_is_active ON courses(is_active);

-- books
CREATE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn);
CREATE INDEX IF NOT EXISTS idx_books_is_active ON books(is_active);

-- academic_book_links
CREATE INDEX IF NOT EXISTS idx_academic_book_links_professor_id ON academic_book_links(professor_id);
CREATE INDEX IF NOT EXISTS idx_academic_book_links_course_id ON academic_book_links(course_id);
CREATE INDEX IF NOT EXISTS idx_academic_book_links_book_id ON academic_book_links(book_id);
CREATE INDEX IF NOT EXISTS idx_academic_book_links_is_active ON academic_book_links(is_active);

-- users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- user_academic_profiles
CREATE INDEX IF NOT EXISTS idx_user_academic_profiles_user_id ON user_academic_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_academic_profiles_university_id ON user_academic_profiles(university_id);

-- user_courses
CREATE INDEX IF NOT EXISTS idx_user_courses_user_id ON user_courses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_courses_course_id ON user_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_user_courses_professor_id ON user_courses(professor_id);

-- listings
CREATE INDEX IF NOT EXISTS idx_listings_seller_id ON listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_book_id ON listings(book_id);
CREATE INDEX IF NOT EXISTS idx_listings_university_id ON listings(university_id);
CREATE INDEX IF NOT EXISTS idx_listings_professor_id ON listings(professor_id);
CREATE INDEX IF NOT EXISTS idx_listings_course_id ON listings(course_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_listing_type ON listings(listing_type);
CREATE INDEX IF NOT EXISTS idx_listings_active ON listings(status, listing_type) WHERE status = 'active';

-- listing_images
CREATE INDEX IF NOT EXISTS idx_listing_images_listing_id ON listing_images(listing_id);

-- transactions
CREATE INDEX IF NOT EXISTS idx_transactions_buyer_id ON transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_seller_id ON transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_transactions_listing_id ON transactions(listing_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);

-- transaction_status_log
CREATE INDEX IF NOT EXISTS idx_transaction_status_log_transaction_id ON transaction_status_log(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_status_log_created_at ON transaction_status_log(created_at);

-- reviews
CREATE INDEX IF NOT EXISTS idx_reviews_transaction_id ON reviews(transaction_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews(reviewer_id);

-- disputes
CREATE INDEX IF NOT EXISTS idx_disputes_transaction_id ON disputes(transaction_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_opened_by ON disputes(opened_by);

-- dispute_evidence
CREATE INDEX IF NOT EXISTS idx_dispute_evidence_dispute_id ON dispute_evidence(dispute_id);

-- messages
CREATE INDEX IF NOT EXISTS idx_messages_transaction_id ON messages(transaction_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(recipient_id, is_read) WHERE is_read = false;

-- notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- suggestions
CREATE INDEX IF NOT EXISTS idx_suggestions_submitted_by ON suggestions(submitted_by);
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON suggestions(status);
CREATE INDEX IF NOT EXISTS idx_suggestions_type ON suggestions(suggestion_type);

-- watchlist
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_entity ON watchlist(entity_type, entity_id);

-- ============================================================
-- UPDATED_AT TRIGGER
-- Automatically updates updated_at on row modification
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_universities_updated_at
  BEFORE UPDATE ON universities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_professors_updated_at
  BEFORE UPDATE ON professors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Enable RLS on all tables.
-- Policies are intentionally permissive here — tighten after MVP.
-- Service role key bypasses RLS automatically.
-- ============================================================

ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE professors ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_academic_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_book_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_status_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispute_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE excel_import_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

-- Public read access for academic data (anyone can browse)
CREATE POLICY "Public read cities" ON cities FOR SELECT USING (true);
CREATE POLICY "Public read universities" ON universities FOR SELECT USING (is_active = true);
CREATE POLICY "Public read departments" ON departments FOR SELECT USING (is_active = true);
CREATE POLICY "Public read professors" ON professors FOR SELECT USING (is_active = true);
CREATE POLICY "Public read courses" ON courses FOR SELECT USING (is_active = true);
CREATE POLICY "Public read books" ON books FOR SELECT USING (is_active = true);
CREATE POLICY "Public read academic_book_links" ON academic_book_links FOR SELECT USING (is_active = true);
CREATE POLICY "Public read listings" ON listings FOR SELECT USING (status = 'active');

-- Users can read and update their own data
CREATE POLICY "Users read own profile" ON users FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- ============================================================
-- ADMIN HELPER: Create first admin account
-- Run this separately after migration to create your first admin.
-- Replace the hash below with a real bcrypt hash.
-- Generate one at: https://bcrypt-generator.com (use cost 10)
-- ============================================================
-- INSERT INTO admin_users (email, password_hash, name)
-- VALUES (
--   'admin@yourdomain.com',
--   '$2a$10$REPLACE_WITH_REAL_BCRYPT_HASH_HERE',
--   'Admin'
-- );

-- ============================================================
-- VERIFICATION QUERY
-- Run after migration to confirm all 23 tables exist
-- ============================================================
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
-- ORDER BY table_name;
