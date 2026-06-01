export default function AskQuestionPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold text-charcoal-900 mb-2">Ask a Question</h1>
      <p className="text-charcoal-500 mb-8">
        Submit your question to the community. Clear, specific questions get better answers.
      </p>

      <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
        {/* Question title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-charcoal-700 mb-1.5">
            Question Title
          </label>
          <input
            id="title"
            type="text"
            placeholder="e.g. How do I reset my password?"
            className="w-full px-4 py-2.5 text-sm bg-sand-50 border border-sand-200 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-brown-300"
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-charcoal-700 mb-1.5">
            Category
          </label>
          <select
            id="category"
            className="w-full px-4 py-2.5 text-sm bg-sand-50 border border-sand-200 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-brown-300"
          >
            <option value="">Select a category</option>
            <option value="general">General</option>
            <option value="technical">Technical</option>
            <option value="billing">Billing</option>
          </select>
        </div>

        {/* Details */}
        <div>
          <label htmlFor="details" className="block text-sm font-medium text-charcoal-700 mb-1.5">
            Additional Details
          </label>
          <textarea
            id="details"
            rows={5}
            placeholder="Provide context, steps to reproduce, or any relevant information..."
            className="w-full px-4 py-2.5 text-sm bg-sand-50 border border-sand-200 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-brown-300 resize-none"
          />
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-charcoal-700 mb-1.5">
            Tags <span className="text-charcoal-400 font-normal">(optional)</span>
          </label>
          <input
            id="tags"
            type="text"
            placeholder="e.g. account, password, login"
            className="w-full px-4 py-2.5 text-sm bg-sand-50 border border-sand-200 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-brown-300"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full px-6 py-3 text-sm font-semibold bg-brown-500 text-sand-50 rounded-lg
                     hover:bg-brown-600 transition-colors"
        >
          Submit Question
        </button>
      </form>
    </div>
  )
}