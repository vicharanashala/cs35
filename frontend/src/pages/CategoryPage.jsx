import { useParams } from 'react-router-dom'

export default function CategoryPage() {
  const { id } = useParams()

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-bold text-charcoal-800 dark:text-sand-100">
        Category: {id}
      </h1>
      <p className="mt-2 text-charcoal-500 dark:text-charcoal-400">
        Browse FAQs in this category.
      </p>
      {/* Page content will be implemented in the next phase */}
    </div>
  )
}