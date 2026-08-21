-- Extend role enum
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'canteen_admin';

-- CreateEnum
CREATE TYPE "LibraryBookCopyStatus" AS ENUM ('available', 'reserved', 'borrowed', 'maintenance', 'lost');

-- CreateEnum
CREATE TYPE "LibraryLoanStatus" AS ENUM ('borrowed', 'returned', 'overdue');

-- CreateEnum
CREATE TYPE "LibraryReservationStatus" AS ENUM ('active', 'fulfilled', 'cancelled', 'expired');

-- CreateEnum
CREATE TYPE "CanteenOrderStatus" AS ENUM ('pending_payment', 'paid', 'completed', 'cancelled', 'payment_failed');

-- CreateEnum
CREATE TYPE "CanteenPaymentStatus" AS ENUM ('pending', 'paid', 'failed', 'cancelled', 'expired');

-- CreateEnum
CREATE TYPE "SosRequestStatus" AS ENUM ('active', 'cancelled', 'resolved', 'expired');

-- CreateEnum
CREATE TYPE "KnowledgeDocumentSource" AS ENUM ('manual', 'faq', 'policy', 'service');

-- CreateTable
CREATE TABLE "library_books" (
    "id" TEXT NOT NULL,
    "open_library_id" TEXT,
    "isbn_13" TEXT,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "authors" TEXT NOT NULL,
    "subjects" TEXT[],
    "publisher" TEXT,
    "published_at" TEXT,
    "language" TEXT,
    "cover_url" TEXT,
    "description" TEXT,
    "shelf_code" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "library_books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "library_book_copies" (
    "id" TEXT NOT NULL,
    "book_id" TEXT NOT NULL,
    "copy_code" TEXT NOT NULL,
    "status" "LibraryBookCopyStatus" NOT NULL DEFAULT 'available',
    "acquired_at" TIMESTAMP(3),
    "condition_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "library_book_copies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "library_loans" (
    "id" TEXT NOT NULL,
    "copy_id" TEXT NOT NULL,
    "borrower_id" TEXT NOT NULL,
    "status" "LibraryLoanStatus" NOT NULL DEFAULT 'borrowed',
    "borrowed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_at" TIMESTAMP(3) NOT NULL,
    "returned_at" TIMESTAMP(3),
    "renewed_count" INTEGER NOT NULL DEFAULT 0,
    "borrow_note" TEXT,
    "return_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "library_loans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "library_reservations" (
    "id" TEXT NOT NULL,
    "book_id" TEXT NOT NULL,
    "requester_id" TEXT NOT NULL,
    "status" "LibraryReservationStatus" NOT NULL DEFAULT 'active',
    "note" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "fulfilled_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "library_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canteen_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "canteen_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canteen_products" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "price" INTEGER NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "canteen_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canteen_orders" (
    "id" TEXT NOT NULL,
    "order_code" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "completed_by_id" TEXT,
    "status" "CanteenOrderStatus" NOT NULL DEFAULT 'pending_payment',
    "total_amount" INTEGER NOT NULL,
    "note" TEXT,
    "completed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "canteen_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canteen_order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "unit_price" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "line_total" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "canteen_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canteen_payment_transactions" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_order_id" TEXT NOT NULL,
    "request_id" TEXT,
    "amount" INTEGER NOT NULL,
    "status" "CanteenPaymentStatus" NOT NULL DEFAULT 'pending',
    "checkout_url" TEXT,
    "request_payload" JSONB,
    "response_payload" JSONB,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "canteen_payment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sos_requests" (
    "id" TEXT NOT NULL,
    "requester_id" TEXT NOT NULL,
    "resolver_id" TEXT,
    "status" "SosRequestStatus" NOT NULL DEFAULT 'active',
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "accuracy_meters" DOUBLE PRECISION,
    "address_snapshot" TEXT,
    "contact_snapshot" JSONB,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "resolved_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "sos_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_documents" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "source" "KnowledgeDocumentSource" NOT NULL DEFAULT 'manual',
    "source_url" TEXT,
    "content_text" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "knowledge_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_chunks" (
    "id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "chunk_index" INTEGER NOT NULL,
    "content_text" TEXT NOT NULL,
    "keyword_tokens" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "knowledge_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "intent" TEXT,
    "confidence" DOUBLE PRECISION,
    "citations" JSONB,
    "deep_links" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "library_books_open_library_id_key" ON "library_books"("open_library_id");
CREATE UNIQUE INDEX "library_books_isbn_13_key" ON "library_books"("isbn_13");
CREATE INDEX "library_books_title_idx" ON "library_books"("title");
CREATE INDEX "library_books_is_active_idx" ON "library_books"("is_active");
CREATE UNIQUE INDEX "library_book_copies_copy_code_key" ON "library_book_copies"("copy_code");
CREATE INDEX "library_book_copies_book_id_status_idx" ON "library_book_copies"("book_id", "status");
CREATE INDEX "library_loans_borrower_id_status_idx" ON "library_loans"("borrower_id", "status");
CREATE INDEX "library_loans_copy_id_status_idx" ON "library_loans"("copy_id", "status");
CREATE INDEX "library_reservations_requester_id_status_idx" ON "library_reservations"("requester_id", "status");
CREATE INDEX "library_reservations_book_id_status_idx" ON "library_reservations"("book_id", "status");
CREATE UNIQUE INDEX "canteen_categories_slug_key" ON "canteen_categories"("slug");
CREATE INDEX "canteen_categories_is_active_sort_order_idx" ON "canteen_categories"("is_active", "sort_order");
CREATE UNIQUE INDEX "canteen_products_slug_key" ON "canteen_products"("slug");
CREATE INDEX "canteen_products_category_id_is_active_sort_order_idx" ON "canteen_products"("category_id", "is_active", "sort_order");
CREATE UNIQUE INDEX "canteen_orders_order_code_key" ON "canteen_orders"("order_code");
CREATE INDEX "canteen_orders_created_by_id_status_idx" ON "canteen_orders"("created_by_id", "status");
CREATE INDEX "canteen_orders_status_created_at_idx" ON "canteen_orders"("status", "created_at");
CREATE INDEX "canteen_order_items_order_id_idx" ON "canteen_order_items"("order_id");
CREATE INDEX "canteen_order_items_product_id_idx" ON "canteen_order_items"("product_id");
CREATE UNIQUE INDEX "canteen_payment_transactions_provider_order_id_key" ON "canteen_payment_transactions"("provider_order_id");
CREATE UNIQUE INDEX "canteen_payment_transactions_request_id_key" ON "canteen_payment_transactions"("request_id");
CREATE INDEX "canteen_payment_transactions_order_id_status_idx" ON "canteen_payment_transactions"("order_id", "status");
CREATE INDEX "sos_requests_status_created_at_idx" ON "sos_requests"("status", "created_at");
CREATE INDEX "sos_requests_requester_id_status_idx" ON "sos_requests"("requester_id", "status");
CREATE UNIQUE INDEX "knowledge_documents_slug_key" ON "knowledge_documents"("slug");
CREATE INDEX "knowledge_documents_is_active_idx" ON "knowledge_documents"("is_active");
CREATE UNIQUE INDEX "knowledge_chunks_document_id_chunk_index_key" ON "knowledge_chunks"("document_id", "chunk_index");
CREATE INDEX "knowledge_chunks_keyword_tokens_idx" ON "knowledge_chunks" USING GIN ("keyword_tokens");
CREATE INDEX "chat_sessions_user_id_updated_at_idx" ON "chat_sessions"("user_id", "updated_at");
CREATE INDEX "chat_messages_session_id_created_at_idx" ON "chat_messages"("session_id", "created_at");

-- AddForeignKey
ALTER TABLE "library_book_copies" ADD CONSTRAINT "library_book_copies_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "library_books"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "library_loans" ADD CONSTRAINT "library_loans_copy_id_fkey" FOREIGN KEY ("copy_id") REFERENCES "library_book_copies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "library_loans" ADD CONSTRAINT "library_loans_borrower_id_fkey" FOREIGN KEY ("borrower_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "library_reservations" ADD CONSTRAINT "library_reservations_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "library_books"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "library_reservations" ADD CONSTRAINT "library_reservations_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "canteen_products" ADD CONSTRAINT "canteen_products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "canteen_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "canteen_orders" ADD CONSTRAINT "canteen_orders_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "canteen_orders" ADD CONSTRAINT "canteen_orders_completed_by_id_fkey" FOREIGN KEY ("completed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "canteen_order_items" ADD CONSTRAINT "canteen_order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "canteen_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "canteen_order_items" ADD CONSTRAINT "canteen_order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "canteen_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "canteen_payment_transactions" ADD CONSTRAINT "canteen_payment_transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "canteen_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sos_requests" ADD CONSTRAINT "sos_requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sos_requests" ADD CONSTRAINT "sos_requests_resolver_id_fkey" FOREIGN KEY ("resolver_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "knowledge_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
