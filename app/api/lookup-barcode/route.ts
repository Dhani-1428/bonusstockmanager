import { NextRequest, NextResponse } from 'next/server'

/**
 * Barcode Lookup API
 * 
 * This API looks up product information from various free barcode databases.
 * We'll try multiple sources to get the best results.
 */

interface BarcodeProduct {
  name?: string
  brand?: string
  sku?: string
  description?: string
  category?: string
  image?: string
  price?: number
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const barcode = searchParams.get('barcode')

    if (!barcode || barcode.trim().length === 0) {
      return NextResponse.json(
        { error: 'Barcode is required' },
        { status: 400 }
      )
    }

    const cleanBarcode = barcode.trim()

    // Try multiple barcode lookup sources
    const product = await lookupBarcode(cleanBarcode)

    if (!product || (!product.name && !product.brand)) {
      return NextResponse.json(
        { 
          error: 'Product not found',
          message: 'No product information found for this barcode. Please enter details manually.'
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      product,
    })
  } catch (error: any) {
    console.error('Barcode lookup error:', error)
    return NextResponse.json(
      {
        error: 'Failed to lookup barcode',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

async function lookupBarcode(barcode: string): Promise<BarcodeProduct | null> {
  // Try Open Product Data API (free, no key required)
  try {
    const response = await fetch(`https://world.openproductdata.org/api/v1/product/${barcode}`, {
      headers: {
        'Accept': 'application/json',
      },
      // Add timeout
      signal: AbortSignal.timeout(5000),
    })

    if (response.ok) {
      const data = await response.json()
      if (data.product && data.product.product_name) {
        return {
          name: data.product.product_name,
          brand: data.product.brands || data.product.brand,
          description: data.product.generic_name || data.product.product_name,
          category: data.product.categories,
          image: data.product.image_url,
        }
      }
    }
  } catch (error) {
    console.debug('Open Product Data API failed:', error)
  }

  // Try UPCitemdb (free tier)
  try {
    const response = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`, {
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    })

    if (response.ok) {
      const data = await response.json()
      if (data.items && data.items.length > 0) {
        const item = data.items[0]
        return {
          name: item.title || item.description,
          brand: item.brand,
          description: item.description,
          category: item.category,
          image: item.images && item.images.length > 0 ? item.images[0] : undefined,
          price: item.lowest_recorded_price || item.highest_recorded_price,
        }
      }
    }
  } catch (error) {
    console.debug('UPCitemdb API failed:', error)
  }

  // Try Barcode Lookup API (alternative)
  try {
    const response = await fetch(`https://api.barcodelookup.com/v3/products?barcode=${barcode}&formatted=y&key=demo`, {
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    })

    if (response.ok) {
      const data = await response.json()
      if (data.products && data.products.length > 0) {
        const product = data.products[0]
        return {
          name: product.product_name,
          brand: product.brand,
          description: product.description,
          category: product.category,
          image: product.images && product.images.length > 0 ? product.images[0] : undefined,
          price: product.stores && product.stores.length > 0 ? product.stores[0].price : undefined,
        }
      }
    }
  } catch (error) {
    console.debug('Barcode Lookup API failed:', error)
  }

  return null
}
