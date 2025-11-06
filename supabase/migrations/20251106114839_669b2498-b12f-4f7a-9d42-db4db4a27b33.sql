-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  subscription_tier VARCHAR(20) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'studio')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create edit history table
CREATE TABLE public.edit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  image_url TEXT NOT NULL,
  original_image_url TEXT,
  task_type VARCHAR(50),
  confidence FLOAT,
  generation_time_ms INT,
  model_used VARCHAR(100),
  resolution VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_edit_history_user_id ON public.edit_history(user_id);
CREATE INDEX idx_edit_history_created_at ON public.edit_history(created_at DESC);

-- Create marketplace products table
CREATE TABLE public.marketplace_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category VARCHAR(50) CHECK (category IN ('style', 'preset', 'template')),
  preview_image_url TEXT,
  prompt_template TEXT,
  price DECIMAL(5,2) DEFAULT 0,
  rating FLOAT DEFAULT 0,
  num_ratings INT DEFAULT 0,
  downloads INT DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_marketplace_products_creator_id ON public.marketplace_products(creator_id);
CREATE INDEX idx_marketplace_products_category ON public.marketplace_products(category);

-- Create user credits table
CREATE TABLE public.user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  free_credits INT DEFAULT 50,
  paid_credits INT DEFAULT 0,
  subscription_tier VARCHAR(20) DEFAULT 'free',
  last_reset TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edit_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for edit history
CREATE POLICY "Users can view their own history"
  ON public.edit_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own history"
  ON public.edit_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for marketplace
CREATE POLICY "Anyone can view published products"
  ON public.marketplace_products FOR SELECT
  USING (is_published = true);

CREATE POLICY "Creators can view their own products"
  ON public.marketplace_products FOR SELECT
  USING (auth.uid() = creator_id);

CREATE POLICY "Users can create products"
  ON public.marketplace_products FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their own products"
  ON public.marketplace_products FOR UPDATE
  USING (auth.uid() = creator_id);

-- RLS Policies for credits
CREATE POLICY "Users can view their own credits"
  ON public.user_credits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own credits"
  ON public.user_credits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own credits"
  ON public.user_credits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_marketplace_products_updated_at
  BEFORE UPDATE ON public.marketplace_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();