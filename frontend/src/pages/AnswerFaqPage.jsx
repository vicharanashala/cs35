export default function AnswerFaqPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold text-charcoal-900 mb-2">Answer a Question</h1>
      <p className="text-charcoal-500 mb-8">
        Help the community by providing a clear, accurate answer.
      </p>

      {/* Question preview */}
      <div className="bg-sand-100 border border-sand-200 rounded-xl p-5 mb-6">
        <div className="text-xs font-medium text-brown-600 uppercase tracking-wide mb-1.5">
          Question
        </div>
        <h2 className="text-base font-semibold text-charcoal-800 mb-2">
          How do I set up two-factor authentication?
        </h2>
        <p className="text-sm text-charcoal-500">
          I'd like to add an extra layer of security to my account but can't find the option.
        </p>
      </div>

      {/* Answer form */}
      <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label htmlFor="answer" className="block text-sm font-medium text-charcoal-700 mb-1.5">
            Your Answer
          </label>
          <textarea
            id="answer"
            rows={8}
            placeholder="Write a clear, helpful answer..."
            className="w-full px-4 py-2.5 text-sm bg-sand-50 border border-sand-200 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-brown-300 resize-none"
          />
        </div>

        <div>
          <label htmlFor="sources" className="block text-sm font-medium text-charcoal-700 mb-1.5">
            Sources <span className="text-charcoal-400 font-normal">(optional)</span>
          </label>
          <input
            id="sources"
            type="text"
            placeholder="Link to relevant documentation or resources"
            className="w-full px-4 py-2.5 text-sm bg-sand-50 border border-sand-200 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-brown-300"
          />
        </div>

        <button
          type="submit"
          className="w-full px-6 py-3 text-sm font-semibold bg-brown-500 text-sand-50 rounded-lg
                     hover:bg-brown-600 transition-colors"
        >
          Submit Answer
        </button>
      </form>
    </div>
  )
}