// Curated, hand-picked stock photos — NOT a random/keyword-based service.
// Each category maps to one specific, verified image. No randomness, no unmoderated content.
const CATEGORY_IMAGES: Record<string, string> = {
  'Web Development': 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=640&h=480&fit=crop&q=80',
  'Data Science': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=640&h=480&fit=crop&q=80',
  'Mobile Development': 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=640&h=480&fit=crop&q=80',
  'Design': 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=640&h=480&fit=crop&q=80',
  'Graphic Design': 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=640&h=480&fit=crop&q=80',
  'Business': 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=640&h=480&fit=crop&q=80',
  'Business Finance': 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=640&h=480&fit=crop&q=80',
  'Marketing': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=640&h=480&fit=crop&q=80',
  'Photography': 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=640&h=480&fit=crop&q=80',
  'Photography & Video': 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=640&h=480&fit=crop&q=80',
  'Personal Development': 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=640&h=480&fit=crop&q=80',
  'Musical Instruments': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=640&h=480&fit=crop&q=80',
  'Music': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=640&h=480&fit=crop&q=80',
}

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=640&h=480&fit=crop&q=80'

export function courseImage(_id: number, categoryName?: string, _title?: string, size = '640/480') {
  const base = (categoryName && CATEGORY_IMAGES[categoryName]) || DEFAULT_IMAGE
  const [w, h] = size.split('/')
  return base.replace('w=640&h=480', `w=${w}&h=${h}`)
}
