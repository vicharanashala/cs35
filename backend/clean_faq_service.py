import re
import os

filepath = r"c:\Users\manos\OneDrive\Desktop\AskSam\backend\src\modules\faq\faq.service.ts"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Remove import
content = re.sub(r"import \{ LocalDataService \} from '\./local-data\.service';\n", "", content)

# Remove from constructor
content = re.sub(r"@Optional\(\) private localData: LocalDataService,?\s*", "", content)

# Remove hasMongoDB method
content = re.sub(r"  private get hasMongoDB\(\) \{[\s\S]*?\}\n\n", "", content)

# Replace this.hasMongoDB usage in seed
content = re.sub(r"    if \(this\.hasMongoDB\) \{\n      await this\.seedFromJson\(\);\n    \}", "    await this.seedFromJson();", content)

# Remove all `if (!this.hasMongoDB) return ...`
content = re.sub(r"\s*if \(!this\.hasMongoDB\) return[^\n]*;", "", content)

# Replace catch { return this.localData... } with catch { return null; } or [] depending on context
# Let's just find `this.localData...` and replace it
content = re.sub(r"return this\.localData\.getAllFAQs\([^)]*\);", "return { data: [], total: 0, page: 1, limit: 20 };", content)
content = re.sub(r"return this\.localData\.getCategories\([^)]*\);", "return [];", content)
content = re.sub(r"return this\.localData\.getFaqById\([^)]*\);", "return null;", content)
content = re.sub(r"return this\.localData\.getOpenQuestions\([^)]*\);", "return { data: [], total: 0, page: 1, limit: 20 };", content)
content = re.sub(r"return this\.localData\.getQuestionById\([^)]*\);", "return null;", content)
content = re.sub(r"return this\.localData\.createQuestion\([^)]*\);", "return null;", content)
content = re.sub(r"return this\.localData\.reopenQuestion\([^)]*\);", "return null;", content)
content = re.sub(r"return this\.localData\.addAnswer\([^)]*\);", "return null;", content)


with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Cleaned up faq.service.ts")
