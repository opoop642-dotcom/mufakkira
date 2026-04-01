import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { titleAr, titleEn, bodyAr, bodyEn, lang, fieldName } = await request.json()

    const title = lang === 'ar' ? titleAr : titleEn
    const body = lang === 'ar' ? bodyAr : bodyEn
    const isArabic = lang === 'ar'

    const prompt = isArabic
      ? `أنت مُيسِّر نقاش فكري في مجتمع بحثي. 
اقرأ هذه الفكرة البحثية في مجال "${fieldName}":

العنوان: ${title}
المحتوى: ${body}

اقترح 3 أسئلة عميقة لتحفيز النقاش بين أعضاء المجتمع.
الأسئلة يجب أن:
- تكون استفزازية فكرياً لا سطحية
- تفتح آفاقاً جديدة لم يذكرها الكاتب
- تناسب مجتمعاً بحثياً متنوع التخصصات

أعطني الأسئلة الثلاثة فقط، كل سؤال في سطر، بدون ترقيم أو مقدمة.`
      : `You are a discussion facilitator in a research community.
Read this research idea in the field of "${fieldName}":

Title: ${title}
Content: ${body}

Suggest 3 deep questions to stimulate discussion among community members.
Questions should:
- Be intellectually provocative, not superficial
- Open new horizons not mentioned by the author
- Suit a research community with diverse backgrounds

Give me only the three questions, each on a new line, without numbering or introduction.`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const questions = text.split('\n').filter(q => q.trim().length > 0).slice(0, 3)

    return NextResponse.json({ questions })
  } catch (error) {
    console.error('AI suggestion error:', error)
    return NextResponse.json({ questions: [] }, { status: 500 })
  }
}