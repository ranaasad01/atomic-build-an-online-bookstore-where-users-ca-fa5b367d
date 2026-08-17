// Auto-generated from the connected Supabase schema. Do not edit by hand.

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      books: {
        Row: {
          id: string
          title: string
          author: string
          description: string | null
          genre: string | null
          price: string
          cover_image: string | null
          isbn: string | null
          publisher: string | null
          published_at: string | null
          stock_quantity: number
          is_featured: boolean
          is_bestseller: boolean
          rating: string
          rating_count: number
          pages: number | null
          created_at: string
        }
      }
      orders: {
        Row: {
          id: string
          order_number: string
          user_id: string | null
          subtotal: string
          tax: string
          shipping_cost: string
          total: string
          shipping_name: string
          shipping_email: string
          shipping_address: string
          shipping_city: string
          shipping_state: string
          shipping_postal_code: string
          shipping_country: string
          shipping_method: string
          created_at: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          book_id: string | null
          title: string
          author: string
          price: string
          quantity: number
          format: string
          cover_image: string | null
          created_at: string
        }
      }
    }
  }
}