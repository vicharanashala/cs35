export default function FaqDetailsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Breadcrumb */}
      <div className="text-sm text-charcoal-400 mb-6">
        Home &rsaquo; FAQ Details
      </div>

      {/* FAQ card placeholder */}
      <article className="bg-sand-100 border border-sand-200 rounded-xl p-8">
        <div className="text-xs font-medium text-brown-600 uppercase tracking-wide mb-2">
          Category
        </div>
        <h1 className="text-2xl font-bold text-charcoal-900 mb-4">
          FAQ Question Title
        </h1>
        <p className="text-charcoal-500 leading-relaxed">
          Full answer text will be displayed here. This page shows the complete
          question with its approved answer, vote count, and community feedback.
        </p>
      </article>

      {/* Actions placeholder */}
      <div className="mt-6 flex items-center gap-4">
        <button className="px-4 py-2 text-sm font-medium bg-brown-500 text-sand-50 rounded-lg hover:bg-brown-600 transition-colors">
          Upvote
        </button>
        <button className="px-4 py-2 text-sm font-medium border border-sand-300 text-charcoal-600 rounded-lg hover:bg-sand-100 transition-colors">
          Suggest Edit
        </button>
      </div>
    </div>
  )
}