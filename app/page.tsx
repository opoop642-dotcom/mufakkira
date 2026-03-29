'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase, Field, Note, Comment, User, Notification } from '@/lib/supabase'

// ── Translations ───────────────────────────────
const T: Record<string, Record<string, string>> = {
  ar: {
    appName:'مُفَكِّرة', tagline:'مجتمع الأفكار البحثية',
    chooseWorld:'اختر عالمك', headline:'كل فكرة تستحق نقاشاً حقيقياً',
    ideas:'فكرة', comments:'تعليق', votes:'تصويت',
    enterWorld:'ادخل العالم ←', newWorld:'عالم جديد',
    back:'→ رجوع', addIdea:'+ اقترح فكرة', newIdea:'فكرة جديدة',
    publish:'نشر', cancel:'إلغاء', create:'إنشاء',
    titlePlaceholder:'عنوان الفكرة', bodyPlaceholder:'اكتب فكرتك بالتفصيل...',
    tags:'الوسوم — مفصولة بفاصلة',
    discussion:'النقاش', addDiscussion:'أضف للنقاش',
    yourName:'اسمك', yourThoughts:'شاركنا رأيك...',
    postComment:'نشر', close:'إغلاق', reply:'↩ رد',
    beFirst:'كن أول من يناقش', noIdeas:'لا أفكار بعد — كن الأول',
    now:'الآن', switchLang:'EN', dir:'rtl', align:'right',
    searchPlaceholder:'ابحث في الأفكار...',
    welcome:'مرحباً بك في مُفَكِّرة',
    welcomeSub:'اختر اسمك للمشاركة في المجتمع',
    usernamePlaceholder:'اسمك في المجتمع', join:'انضم',
    sortNew:'الأحدث', sortVotes:'الأكثر تصويتاً', sortActive:'الأكثر نقاشاً',
    notifTitle:'الإشعارات', noNotifs:'لا إشعارات جديدة',
    markRead:'تحديد كمقروء',
    profile:'ملفي الشخصي', memberSince:'عضو منذ',
    totalIdeas:'أفكار', totalVotes:'تصويت', totalComments:'تعليق',
    myIdeas:'أفكاري', myComments:'تعليقاتي',
    noMyIdeas:'لم تنشر أفكاراً بعد', noMyComments:'لم تكتب تعليقاً بعد',
    influence:'التأثير', editName:'✎', saveEdit:'حفظ',
    rank0:'قارئ', rank1:'مفكر', rank2:'محاور', rank3:'مساهم', rank4:'مؤثر',
    anonymous:'مجهول', loading:'جاري التحميل...',
    error:'حدث خطأ — حاول مجدداً',
  },
  en: {
    appName:'Mufakkira', tagline:'Research Ideas Community',
    chooseWorld:'CHOOSE YOUR WORLD', headline:'Every Idea Deserves Real Discussion',
    ideas:'ideas', comments:'comments', votes:'votes',
    enterWorld:'Enter World →', newWorld:'New World',
    back:'← Back', addIdea:'+ Propose Idea', newIdea:'NEW IDEA',
    publish:'Publish', cancel:'Cancel', create:'Create',
    titlePlaceholder:'Idea title', bodyPlaceholder:'Write your idea in detail...',
    tags:'Tags — comma separated',
    discussion:'DISCUSSION', addDiscussion:'ADD TO DISCUSSION',
    yourName:'Your name', yourThoughts:'Share your thoughts...',
    postComment:'Post', close:'Close', reply:'↩ Reply',
    beFirst:'Be the first to discuss', noIdeas:'No ideas yet — be the first',
    now:'now', switchLang:'ع', dir:'ltr', align:'left',
    searchPlaceholder:'Search ideas...',
    welcome:'Welcome to Mufakkira',
    welcomeSub:'Choose your name to join the community',
    usernamePlaceholder:'Your community name', join:'Join',
    sortNew:'Newest', sortVotes:'Top Voted', sortActive:'Most Active',
    notifTitle:'Notifications', noNotifs:'No new notifications',
    markRead:'Mark all read',
    profile:'My Profile', memberSince:'Member since',
    totalIdeas:'ideas', totalVotes:'votes', totalComments:'comments',
    myIdeas:'My Ideas', myComments:'My Comments',
    noMyIdeas:'No ideas yet', noMyComments:'No comments yet',
    influence:'Influence', editName:'✎', saveEdit:'Save',
    rank0:'Reader', rank1:'Thinker', rank2:'Debater', rank3:'Contributor', rank4:'Influencer',
    anonymous:'Anonymous', loading:'Loading...', error:'Error — please try again',
  }
}

function ago(ts: string, lang: string) {
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
  if (s < 60) return T[lang].now
  if (s < 3600) return lang==='ar' ? `${Math.floor(s/60)} د` : `${Math.floor(s/60)}m`
  if (s < 86400) return lang==='ar' ? `${Math.floor(s/3600)} س` : `${Math.floor(s/3600)}h`
  return lang==='ar' ? `${Math.floor(s/86400)} ي` : `${Math.floor(s/86400)}d`
}

function Avatar({ name, color, size=28 }: { name:string, color:string, size?:number }) {
  return (
    <div style={{width:size,height:size,borderRadius:'50%',background:color+'22',display:'flex',alignItems:'center',justifyContent:'center',color,fontWeight:'700',fontSize:size*.36,flexShrink:0}}>
      {(name||'?')[0].toUpperCase()}
    </div>
  )
}

// ── Username Modal ──────────────────────────────
function UsernameModal({ lang, onJoin }: { lang:string, onJoin:(u:User)=>void }) {
  const t = T[lang]
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    const n = name.trim()
    if (n.length < 2) return
    setLoading(true)
    // Check if username exists
    const { data: existing } = await supabase.from('users').select('id').eq('username', n).single()
    if (existing) {
      // Return existing user
      const { data: user } = await supabase.from('users').select('*').eq('username', n).single()
      if (user) { onJoin(user); setLoading(false); return }
    }
    // Create new user
    const { data: user, error: err } = await supabase.from('users').insert({ username: n }).select().single()
    if (err) { setError(t.error); setLoading(false); return }
    onJoin(user)
    setLoading(false)
  }

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.95)',zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(20px)'}}>
      <div style={{background:'#111',border:'1px solid #222',borderRadius:'24px',padding:'52px 44px',width:'420px',maxWidth:'92vw',textAlign:'center'}}>
        <div style={{fontSize:'3rem',marginBottom:'20px'}}>◈</div>
        <h2 style={{fontFamily:lang==='ar'?"'Noto Naskh Arabic',serif":"'Playfair Display',serif",color:'#fff',fontSize:'1.7rem',marginBottom:'10px'}}>{t.welcome}</h2>
        <p style={{color:'#444',fontSize:'0.88rem',marginBottom:'36px'}}>{t.welcomeSub}</p>
        {error && <p style={{color:'#c87e7e',fontSize:'0.82rem',marginBottom:'12px'}}>{error}</p>}
        <input value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()}
          placeholder={t.usernamePlaceholder} dir={t.dir} autoFocus
          style={{width:'100%',background:'#1a1a1a',border:'1px solid #2a2a2a',borderRadius:'10px',padding:'14px 18px',color:'#fff',fontSize:'1rem',marginBottom:'16px',boxSizing:'border-box' as any,outline:'none',textAlign:'center'}}/>
        <button onClick={submit} disabled={name.trim().length<2||loading}
          style={{width:'100%',padding:'13px',background:name.trim().length>=2?'#C8A97E':'#1a1a1a',color:name.trim().length>=2?'#000':'#333',border:'none',borderRadius:'10px',fontWeight:'700',cursor:name.trim().length>=2?'pointer':'default',fontSize:'1rem',fontFamily:'inherit'}}>
          {loading ? '...' : t.join}
        </button>
      </div>
    </div>
  )
}

// ── Note Modal ──────────────────────────────────
function NoteModal({ note, field, lang, user, hasVoted, onClose, onVote }: {
  note: Note, field: Field, lang: string, user: User|null, hasVoted: boolean,
  onClose: ()=>void, onVote: ()=>void
}) {
  const t = T[lang]
  const [comments, setComments] = useState<Comment[]>([])
  const [text, setText] = useState('')
  const [name, setName] = useState(user?.username || '')
  const [replyTo, setReplyTo] = useState<number|null>(null)
  const [replyText, setReplyText] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadComments()
    // Real-time subscription
    const sub = supabase.channel(`comments-${note.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments', filter: `note_id=eq.${note.id}` },
        () => loadComments())
      .subscribe()
    return () => { sub.unsubscribe() }
  }, [note.id])

  const loadComments = async () => {
    const { data } = await supabase.from('comments').select('*')
      .eq('note_id', note.id).order('created_at', { ascending: true })
    if (!data) return
    // Build tree
    const top = data.filter(c => !c.parent_id)
    const withReplies = top.map(c => ({ ...c, replies: data.filter(r => r.parent_id === c.id) }))
    setComments(withReplies)
  }

  const post = async () => {
    if (!text.trim()) return
    setLoading(true)
    const authorName = name.trim() || t.anonymous
    await supabase.from('comments').insert({ note_id: note.id, author_id: user?.id, author_name: authorName, body: text.trim() })
    // Notify note author
    if (user && note.author_id && note.author_id !== user.id) {
      await supabase.from('notifications').insert({
        to_user_id: note.author_id, from_name: authorName, type: 'comment',
        note_id: note.id, note_title: lang==='ar' ? note.title_ar : note.title_en
      })
    }
    setText('')
    setLoading(false)
  }

  const postReply = async (parentId: number, parentAuthorId: string) => {
    if (!replyText.trim()) return
    const authorName = name.trim() || t.anonymous
    await supabase.from('comments').insert({ note_id: note.id, parent_id: parentId, author_id: user?.id, author_name: authorName, body: replyText.trim() })
    if (user && parentAuthorId && parentAuthorId !== user.id) {
      await supabase.from('notifications').insert({
        to_user_id: parentAuthorId, from_name: authorName, type: 'reply',
        note_id: note.id, note_title: lang==='ar' ? note.title_ar : note.title_en
      })
    }
    setReplyText(''); setReplyTo(null)
  }

  const likeComment = async (commentId: number, currentLikes: number) => {
    await supabase.from('comments').update({ likes: currentLikes + 1 }).eq('id', commentId)
    loadComments()
  }

  const title = lang==='ar' ? note.title_ar : note.title_en
  const body  = lang==='ar' ? note.body_ar  : note.body_en

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.93)',zIndex:200,overflowY:'auto',backdropFilter:'blur(16px)',padding:'36px 16px'}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:'#0c0c0c',border:`1px solid ${field.color}28`,borderRadius:'22px',width:'700px',maxWidth:'96vw',margin:'0 auto',direction:t.dir}}>

        {/* Note header */}
        <div style={{padding:'36px 36px 26px',borderBottom:`1px solid ${field.color}12`}}>
          <div style={{display:'flex',alignItems:'center',gap:'9px',marginBottom:'16px'}}>
            <div style={{width:'30px',height:'30px',borderRadius:'8px',background:field.color+'18',display:'flex',alignItems:'center',justifyContent:'center',color:field.color}}>{field.symbol}</div>
            <span style={{color:field.color+'88',fontSize:'0.66rem',fontWeight:'700',letterSpacing:'2px',textTransform:'uppercase'}}>{lang==='ar'?field.name_ar:field.name_en}</span>
          </div>
          <h2 style={{fontFamily:lang==='ar'?"'Noto Naskh Arabic',serif":"'Playfair Display',serif",color:'#fff',fontSize:'1.75rem',marginBottom:'12px',textAlign:t.align as any,lineHeight:1.25}}>{title}</h2>
          <p style={{color:'#666',lineHeight:1.88,textAlign:t.align as any,fontFamily:lang==='ar'?"'Noto Naskh Arabic',serif":'inherit',marginBottom:'16px'}}>{body}</p>
          {note.tags?.length>0&&<div style={{display:'flex',gap:'5px',flexWrap:'wrap',justifyContent:t.dir==='rtl'?'flex-end':'flex-start',marginBottom:'16px'}}>
            {note.tags.map(tg=><span key={tg} style={{padding:'2px 9px',background:field.color+'14',color:field.color+'bb',borderRadius:'20px',fontSize:'0.66rem',fontWeight:'600'}}>{tg}</span>)}
          </div>}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{display:'flex',alignItems:'center',gap:'7px'}}>
              <Avatar name={note.author_name} color={field.color} size={22}/>
              <span style={{color:'#444',fontSize:'0.75rem'}}>{note.author_name} · {ago(note.created_at, lang)}</span>
            </div>
            <button onClick={onVote} disabled={hasVoted}
              style={{display:'flex',alignItems:'center',gap:'6px',padding:'6px 16px',background:hasVoted?field.color+'22':'#141414',color:hasVoted?field.color:'#555',border:`1px solid ${hasVoted?field.color+'44':'#222'}`,borderRadius:'20px',cursor:hasVoted?'default':'pointer',fontSize:'0.82rem',fontWeight:'600',fontFamily:'inherit'}}>
              ▲ {note.votes}
            </button>
          </div>
        </div>

        {/* Comments */}
        <div style={{padding:'26px 36px'}}>
          <p style={{color:'#2e2e2e',fontSize:'0.64rem',letterSpacing:'3px',fontWeight:'700',marginBottom:'20px',textAlign:t.align as any}}>
            {t.discussion} · {comments.length}
          </p>
          {comments.length===0&&<div style={{textAlign:'center',padding:'24px 0',color:'#1e1e1e',marginBottom:'20px'}}>
            <p style={{fontSize:'1.5rem',marginBottom:'6px'}}>💬</p>
            <p style={{fontSize:'0.8rem'}}>{t.beFirst}</p>
          </div>}
          <div style={{marginBottom:'24px',display:'flex',flexDirection:'column',gap:'10px'}}>
            {comments.map(c=>(
              <div key={c.id}>
                <div style={{background:'#131313',border:'1px solid #1c1c1c',borderRadius:'11px',padding:'13px 15px',direction:t.dir}}>
                  <div style={{display:'flex',alignItems:'center',gap:'9px',marginBottom:'9px'}}>
                    <Avatar name={c.author_name} color={field.color} size={26}/>
                    <div>
                      <p style={{color:'#ccc',fontWeight:'600',fontSize:'0.81rem'}}>{c.author_name}</p>
                      <p style={{color:'#2e2e2e',fontSize:'0.64rem'}}>{ago(c.created_at, lang)}</p>
                    </div>
                  </div>
                  <p style={{color:'#999',fontSize:'0.87rem',lineHeight:1.75,marginBottom:'10px',direction:'auto',textAlign:'start'}}>{c.body}</p>
                  <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                    <button onClick={()=>likeComment(c.id, c.likes)} style={{background:'none',border:'1px solid #1e1e1e',borderRadius:'20px',padding:'2px 11px',color:'#383838',cursor:'pointer',fontSize:'0.7rem',fontFamily:'inherit'}}>♥ {c.likes}</button>
                    <button onClick={()=>setReplyTo(replyTo===c.id?null:c.id)} style={{background:'none',border:'none',color:replyTo===c.id?field.color:'#383838',cursor:'pointer',fontSize:'0.68rem',fontWeight:'700',fontFamily:'inherit'}}>{t.reply}</button>
                  </div>
                </div>
                {/* Replies */}
                {(c.replies||[]).length>0&&(
                  <div style={{marginTop:'6px',[t.dir==='rtl'?'paddingRight':'paddingLeft']:'16px',[t.dir==='rtl'?'borderRight':'borderLeft']:`2px solid ${field.color}14`}}>
                    {(c.replies||[]).map((r:Comment)=>(
                      <div key={r.id} style={{background:'#0f0f0f',border:'1px solid #161616',borderRadius:'10px',padding:'12px 14px',marginBottom:'6px',direction:t.dir}}>
                        <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}>
                          <Avatar name={r.author_name} color={field.color} size={22}/>
                          <p style={{color:'#bbb',fontWeight:'600',fontSize:'0.78rem'}}>{r.author_name}</p>
                          <p style={{color:'#2a2a2a',fontSize:'0.62rem'}}>{ago(r.created_at, lang)}</p>
                        </div>
                        <p style={{color:'#888',fontSize:'0.85rem',lineHeight:1.7,direction:'auto',textAlign:'start'}}>{r.body}</p>
                      </div>
                    ))}
                  </div>
                )}
                {/* Reply box */}
                {replyTo===c.id&&(
                  <div style={{marginTop:'6px',[t.dir==='rtl'?'paddingRight':'paddingLeft']:'16px',borderLeft:`2px solid ${field.color}14`}}>
                    <div style={{background:'#0f0f0f',border:`1px solid ${field.color}16`,borderRadius:'9px',padding:'13px',direction:t.dir}}>
                      <textarea value={replyText} onChange={e=>setReplyText(e.target.value)} placeholder={t.yourThoughts} rows={2} dir='auto'
                        style={{width:'100%',background:'#161616',border:'1px solid #1e1e1e',borderRadius:'6px',padding:'8px 12px',color:'#fff',resize:'none',marginBottom:'9px',fontSize:'0.82rem',boxSizing:'border-box' as any,outline:'none',fontFamily:'inherit'}}/>
                      <div style={{display:'flex',gap:'7px'}}>
                        <button onClick={()=>postReply(c.id, c.author_id)} style={{padding:'6px 14px',background:field.color,color:'#000',border:'none',borderRadius:'6px',fontWeight:'700',cursor:'pointer',fontSize:'0.78rem',fontFamily:'inherit'}}>{t.reply.replace('↩ ','')}</button>
                        <button onClick={()=>setReplyTo(null)} style={{padding:'6px 10px',background:'none',border:'1px solid #1e1e1e',color:'#444',borderRadius:'6px',cursor:'pointer',fontFamily:'inherit'}}>{t.cancel}</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* New comment */}
          <div style={{borderTop:`1px solid ${field.color}10`,paddingTop:'24px'}}>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder={t.yourName} dir={t.dir}
              style={{width:'100%',background:'#111',border:`1px solid ${field.color}14`,borderRadius:'9px',padding:'10px 14px',color:'#fff',marginBottom:'7px',fontSize:'0.86rem',boxSizing:'border-box' as any,outline:'none'}}/>
            <textarea value={text} onChange={e=>setText(e.target.value)} placeholder={t.yourThoughts} rows={3} dir='auto'
              style={{width:'100%',background:'#111',border:`1px solid ${field.color}14`,borderRadius:'9px',padding:'11px 14px',color:'#fff',resize:'vertical',marginBottom:'11px',fontFamily:lang==='ar'?"'Noto Naskh Arabic',serif":'inherit',fontSize:'0.88rem',boxSizing:'border-box' as any,outline:'none'}}/>
            <div style={{display:'flex',gap:'9px'}}>
              <button onClick={post} disabled={loading||!text.trim()} style={{padding:'10px 24px',background:field.color,color:'#000',border:'none',borderRadius:'8px',fontWeight:'700',cursor:'pointer',fontSize:'0.88rem',fontFamily:'inherit',opacity:loading?0.7:1}}>
                {loading?'...':t.postComment}
              </button>
              <button onClick={onClose} style={{padding:'10px 14px',background:'none',border:'1px solid #1e1e1e',color:'#444',borderRadius:'8px',cursor:'pointer',fontFamily:'inherit'}}>{t.close}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main App ────────────────────────────────────
export default function App() {
  const [lang, setLang] = useState('ar')
  const [user, setUser] = useState<User|null>(null)
  const [fields, setFields] = useState<Field[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [myVotes, setMyVotes] = useState<Set<number>>(new Set())
  const [activeField, setActiveField] = useState<Field|null>(null)
  const [activeNote, setActiveNote] = useState<Note|null>(null)
  const [showUsername, setShowUsername] = useState(false)
  const [showNotifs, setShowNotifs] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showAddNote, setShowAddNote] = useState(false)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('active')
  const [loading, setLoading] = useState(true)
  const [newNote, setNewNote] = useState({ titleAr:'', titleEn:'', bodyAr:'', bodyEn:'', tags:'' })

  const t = T[lang]

  // Load on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('mufakkira-user')
    if (savedUser) setUser(JSON.parse(savedUser))
    else setShowUsername(true)
    loadFields()
  }, [])

  useEffect(() => {
    if (user) { loadVotes(); loadNotifs() }
  }, [user])

  useEffect(() => {
    if (activeField) loadNotes(activeField.id)
  }, [activeField, sort])

  const loadFields = async () => {
    const { data } = await supabase.from('fields').select('*').order('id')
    if (data) setFields(data)
    setLoading(false)
  }

  const loadNotes = async (fieldId: number) => {
    const { data } = await supabase.from('notes').select('*, comments(count)').eq('field_id', fieldId)
    if (!data) return
    const enriched = data.map((n: any) => ({ ...n, comment_count: n.comments?.[0]?.count || 0 }))
    const sorted = [...enriched].sort((a,b) => {
      if (sort==='votes') return b.votes - a.votes
      if (sort==='active') return b.comment_count - a.comment_count
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
    setNotes(sorted)
  }

  const loadVotes = async () => {
    if (!user) return
    const { data } = await supabase.from('votes').select('note_id').eq('user_id', user.id)
    if (data) setMyVotes(new Set(data.map((v:any) => v.note_id)))
  }

  const loadNotifs = async () => {
    if (!user) return
    const { data } = await supabase.from('notifications').select('*').eq('to_user_id', user.id).order('created_at', { ascending: false }).limit(50)
    if (data) setNotifs(data)
  }

  const handleJoin = (u: User) => {
    setUser(u)
    localStorage.setItem('mufakkira-user', JSON.stringify(u))
    setShowUsername(false)
  }

  const addNote = async () => {
    const title = lang==='ar' ? newNote.titleAr : newNote.titleEn
    if (!title.trim() || !activeField) return
    const { data } = await supabase.from('notes').insert({
      field_id: activeField.id,
      author_id: user?.id, author_name: user?.username || t.anonymous,
      title_ar: newNote.titleAr||newNote.titleEn, title_en: newNote.titleEn||newNote.titleAr,
      body_ar: newNote.bodyAr||newNote.bodyEn, body_en: newNote.bodyEn||newNote.bodyAr,
      tags: newNote.tags.split(',').map(x=>x.trim()).filter(Boolean)
    }).select().single()
    if (data) {
      setNotes(prev=>[data,...prev])
      setNewNote({ titleAr:'', titleEn:'', bodyAr:'', bodyEn:'', tags:'' })
      setShowAddNote(false)
    }
  }

  const voteNote = async (noteId: number) => {
    if (!user || myVotes.has(noteId)) return
    await supabase.from('votes').insert({ note_id: noteId, user_id: user.id })
    await supabase.from('notes').update({ votes: (notes.find(n=>n.id===noteId)?.votes||0)+1 }).eq('id', noteId)
    setMyVotes(prev=>new Set([...prev, noteId]))
    setNotes(prev=>prev.map(n=>n.id===noteId?{...n,votes:n.votes+1}:n))
    setActiveNote(prev=>prev?.id===noteId?{...prev,votes:prev.votes+1}:prev)
  }

  const markRead = async () => {
    if (!user) return
    await supabase.from('notifications').update({ is_read: true }).eq('to_user_id', user.id)
    setNotifs(prev=>prev.map(n=>({...n,is_read:true})))
  }

  const unread = notifs.filter(n=>!n.is_read).length
  const filteredNotes = notes.filter(n => {
    if (!search) return true
    const s = search.toLowerCase()
    return (n.title_ar+n.title_en+n.body_ar+n.body_en).toLowerCase().includes(s)
  })

  if (loading) return (
    <div style={{minHeight:'100vh',background:'#0a0a0a',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <span style={{fontSize:'2rem',color:'#2a2a2a'}}>◈</span>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#0a0a0a',color:'#fff',fontFamily:lang==='ar'?"'Noto Naskh Arabic',serif":"'Crimson Pro',Georgia,serif",direction:t.dir}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Crimson+Pro:wght@300;400;600&family=Noto+Naskh+Arabic:wght@400;600;700&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:#0a0a0a}::-webkit-scrollbar-thumb{background:#1e1e1e;border-radius:2px}
        .fc{transition:transform .3s,border-color .3s}.fc:hover{transform:translateY(-4px)!important;border-color:var(--c)!important}.fc:hover .eh{opacity:1!important;transform:translateY(0)!important}
        .nc{transition:border-color .2s,background .2s}.nc:hover{border-color:var(--c)!important;background:#111!important}
        @keyframes fu{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}.fu{animation:fu .35s ease forwards}
        input,textarea,button{font-family:inherit}
      `}</style>

      {/* Header */}
      <header style={{padding:'16px 32px',borderBottom:'1px solid #141414',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,background:'rgba(10,10,10,0.97)',zIndex:100,backdropFilter:'blur(20px)',gap:'12px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'11px',flexShrink:0}}>
          {activeField&&<button onClick={()=>{setActiveField(null);setShowAddNote(false);setSearch('');setNotes([])}} style={{background:'none',border:'1px solid #1e1e1e',color:'#555',padding:'6px 13px',borderRadius:'7px',cursor:'pointer',fontSize:'0.78rem'}}>{t.back}</button>}
          <div>
            <h1 style={{fontFamily:lang==='ar'?"'Noto Naskh Arabic',serif":"'Playfair Display',serif",fontSize:'1.25rem',fontWeight:'900'}}>{t.appName}</h1>
            <p style={{color:'#222',fontSize:'0.58rem',letterSpacing:'2px',textTransform:'uppercase',marginTop:'1px'}}>{t.tagline}</p>
          </div>
        </div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t.searchPlaceholder} dir={t.dir}
          style={{flex:1,background:'#111',border:'1px solid #1a1a1a',borderRadius:'8px',padding:'8px 14px',color:'#fff',fontSize:'0.85rem',outline:'none',maxWidth:'320px',display:activeField?'block':'none'}}/>
        <div style={{display:'flex',alignItems:'center',gap:'8px',flexShrink:0}}>
          <button onClick={()=>setShowNotifs(v=>!v)} style={{position:'relative',background:'none',border:'1px solid #1a1a1a',color:unread>0?'#C8A97E':'#444',width:'34px',height:'34px',borderRadius:'8px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.9rem'}}>
            🔔{unread>0&&<span style={{position:'absolute',top:'-4px',right:'-4px',background:'#C87E7E',color:'#000',borderRadius:'50%',width:'16px',height:'16px',fontSize:'0.6rem',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'700'}}>{unread}</span>}
          </button>
          {user&&<div onClick={()=>setShowProfile(true)} style={{display:'flex',alignItems:'center',gap:'7px',padding:'5px 12px',background:'#111',border:'1px solid #1a1a1a',borderRadius:'8px',cursor:'pointer'}}>
            <Avatar name={user.username} color='#C8A97E' size={20}/>
            <span style={{color:'#888',fontSize:'0.75rem',maxWidth:'80px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user.username}</span>
          </div>}
          <button onClick={()=>setLang(l=>l==='ar'?'en':'ar')} style={{background:'#111',border:'1px solid #1a1a1a',color:'#555',padding:'7px 14px',borderRadius:'8px',cursor:'pointer',fontSize:'0.8rem'}}>{t.switchLang}</button>
        </div>
      </header>

      {/* Home */}
      {!activeField&&(
        <main style={{padding:'48px 32px',maxWidth:'1200px',margin:'0 auto'}} className='fu'>
          <div style={{marginBottom:'48px'}}>
            <p style={{color:'#252525',fontSize:'0.6rem',letterSpacing:'5px',textTransform:'uppercase',marginBottom:'10px',textAlign:t.align as any}}>{t.chooseWorld}</p>
            <h2 style={{fontFamily:lang==='ar'?"'Noto Naskh Arabic',serif":"'Playfair Display',serif",fontSize:'clamp(1.7rem,4vw,3rem)',fontWeight:'900',lineHeight:1.1,maxWidth:'520px'}}>{t.headline}</h2>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:'14px'}}>
            {fields.map((f,i)=>(
              <div key={f.id} className='fc' onClick={()=>setActiveField(f)}
                style={{'--c':f.color,background:f.bg,border:`1px solid ${f.color}18`,borderRadius:'16px',padding:'28px 22px',cursor:'pointer',position:'relative',overflow:'hidden'} as any}>
                <div style={{position:'absolute',top:'-18px',[t.dir==='rtl'?'right':'left']:'-12px',fontSize:'7rem',color:f.color+'07',fontFamily:"'Playfair Display',serif",fontWeight:'900',lineHeight:1,userSelect:'none',pointerEvents:'none'}}>{f.symbol}</div>
                <div style={{position:'relative'}}>
                  <div style={{width:'38px',height:'38px',borderRadius:'10px',background:f.color+'16',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'16px',fontSize:'1.2rem',color:f.color}}>{f.symbol}</div>
                  <h3 style={{fontFamily:lang==='ar'?"'Noto Naskh Arabic',serif":"'Playfair Display',serif",fontSize:'1.3rem',fontWeight:'700',color:'#fff',marginBottom:'5px',textAlign:t.align as any}}>{lang==='ar'?f.name_ar:f.name_en}</h3>
                  <div className='eh' style={{marginTop:'14px',color:f.color,fontSize:'0.76rem',fontWeight:'600',opacity:0,transform:'translateY(5px)',transition:'all .25s',textAlign:t.align as any}}>{t.enterWorld}</div>
                </div>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* Field view */}
      {activeField&&(
        <main style={{padding:'40px 32px',maxWidth:'800px',margin:'0 auto'}} className='fu'>
          <div style={{marginBottom:'32px',paddingBottom:'32px',borderBottom:`1px solid ${activeField.color}12`}}>
            <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'18px'}}>
              <div style={{width:'46px',height:'46px',borderRadius:'12px',background:activeField.color+'16',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.4rem',color:activeField.color,flexShrink:0}}>{activeField.symbol}</div>
              <h2 style={{fontFamily:lang==='ar'?"'Noto Naskh Arabic',serif":"'Playfair Display',serif",fontSize:'1.85rem',fontWeight:'900',color:'#fff'}}>{lang==='ar'?activeField.name_ar:activeField.name_en}</h2>
            </div>
            <div style={{display:'flex',gap:'7px'}}>
              {(['active','votes','new'] as const).map(s=>(
                <button key={s} onClick={()=>setSort(s)} style={{padding:'5px 14px',background:sort===s?activeField.color+'18':'none',color:sort===s?activeField.color:'#383838',border:`1px solid ${sort===s?activeField.color+'33':'#1a1a1a'}`,borderRadius:'20px',cursor:'pointer',fontSize:'0.72rem',fontWeight:sort===s?'700':'400',fontFamily:'inherit'}}>
                  {s==='active'?t.sortActive:s==='votes'?t.sortVotes:t.sortNew}
                </button>
              ))}
            </div>
          </div>

          <div style={{display:'flex',flexDirection:'column',gap:'10px',marginBottom:'20px'}}>
            {filteredNotes.length===0&&<div style={{textAlign:'center',padding:'44px',color:'#1e1e1e'}}>
              <p style={{fontSize:'2rem',marginBottom:'9px'}}>{activeField.symbol}</p>
              <p style={{fontSize:'0.8rem'}}>{t.noIdeas}</p>
            </div>}
            {filteredNotes.map(note=>(
              <div key={note.id} className='nc' onClick={()=>setActiveNote(note)}
                style={{'--c':activeField.color,background:'#0d0d0d',border:`1px solid ${activeField.color}13`,borderRadius:'12px',padding:'18px 22px',cursor:'pointer'} as any}>
                <h3 style={{fontFamily:lang==='ar'?"'Noto Naskh Arabic',serif":"'Playfair Display',serif",fontSize:'1.1rem',color:'#fff',marginBottom:'5px',textAlign:t.align as any}}>{lang==='ar'?note.title_ar:note.title_en}</h3>
                <p style={{color:'#3e3e3e',fontSize:'0.82rem',lineHeight:1.65,marginBottom:'11px',textAlign:t.align as any,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical' as any,overflow:'hidden'}}>{lang==='ar'?note.body_ar:note.body_en}</p>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'7px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                    <Avatar name={note.author_name} color={activeField.color} size={18}/>
                    <span style={{color:'#333',fontSize:'0.7rem'}}>{note.author_name}</span>
                    {note.tags?.slice(0,2).map(tg=><span key={tg} style={{padding:'1px 8px',background:activeField.color+'0f',color:activeField.color+'99',borderRadius:'20px',fontSize:'0.62rem',fontWeight:'600'}}>{tg}</span>)}
                  </div>
                  <div style={{display:'flex',gap:'10px'}}>
                    <span style={{color:myVotes.has(note.id)?activeField.color:'#2a2a2a',fontSize:'0.72rem'}}>▲ {note.votes}</span>
                    <span style={{color:'#252525',fontSize:'0.72rem'}}>💬 {note.comment_count||0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!showAddNote?(
            <button onClick={()=>setShowAddNote(true)} style={{width:'100%',padding:'14px',background:'none',border:`1px dashed ${activeField.color}20`,borderRadius:'11px',color:activeField.color+'55',fontSize:'0.85rem',cursor:'pointer',fontFamily:'inherit'}}
              onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.color=activeField.color;(e.currentTarget as HTMLButtonElement).style.background=activeField.color+'08'}}
              onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.color=activeField.color+'55';(e.currentTarget as HTMLButtonElement).style.background='none'}}>
              {t.addIdea}
            </button>
          ):(
            <div style={{background:'#0d0d0d',border:`1px solid ${activeField.color}22`,borderRadius:'12px',padding:'22px'}} className='fu'>
              <p style={{color:activeField.color+'77',fontSize:'0.64rem',letterSpacing:'3px',marginBottom:'14px',fontWeight:'700',textAlign:t.align as any}}>{t.newIdea}</p>
              <input value={lang==='ar'?newNote.titleAr:newNote.titleEn} onChange={e=>setNewNote({...newNote,[lang==='ar'?'titleAr':'titleEn']:e.target.value})} placeholder={t.titlePlaceholder} dir={t.dir}
                style={{width:'100%',background:'#131313',border:`1px solid ${activeField.color}16`,borderRadius:'7px',padding:'9px 13px',color:'#fff',marginBottom:'6px',fontSize:'0.93rem',outline:'none'}}/>
              <textarea value={lang==='ar'?newNote.bodyAr:newNote.bodyEn} onChange={e=>setNewNote({...newNote,[lang==='ar'?'bodyAr':'bodyEn']:e.target.value})} placeholder={t.bodyPlaceholder} rows={4} dir={t.dir}
                style={{width:'100%',background:'#131313',border:`1px solid ${activeField.color}16`,borderRadius:'7px',padding:'9px 13px',color:'#fff',marginBottom:'6px',resize:'vertical' as any,fontSize:'0.88rem',outline:'none'}}/>
              <input value={newNote.tags} onChange={e=>setNewNote({...newNote,tags:e.target.value})} placeholder={t.tags} dir={t.dir}
                style={{width:'100%',background:'#131313',border:`1px solid ${activeField.color}16`,borderRadius:'7px',padding:'9px 13px',color:'#fff',marginBottom:'13px',fontSize:'0.82rem',outline:'none'}}/>
              <div style={{display:'flex',gap:'7px'}}>
                <button onClick={addNote} style={{flex:1,padding:'9px',background:activeField.color,color:'#000',border:'none',borderRadius:'7px',fontWeight:'700',cursor:'pointer',fontSize:'0.88rem'}}>{t.publish}</button>
                <button onClick={()=>setShowAddNote(false)} style={{padding:'9px 14px',background:'none',border:`1px solid ${activeField.color}16`,color:'#444',borderRadius:'7px',cursor:'pointer'}}>{t.cancel}</button>
              </div>
            </div>
          )}
        </main>
      )}

      {/* Modals */}
      {showUsername&&!user&&<UsernameModal lang={lang} onJoin={handleJoin}/>}
      {activeNote&&activeField&&(
        <NoteModal note={activeNote} field={activeField} lang={lang} user={user}
          hasVoted={myVotes.has(activeNote.id)}
          onClose={()=>setActiveNote(null)}
          onVote={()=>voteNote(activeNote.id)}/>
      )}

      {/* Notifications panel */}
      {showNotifs&&(
        <div style={{position:'fixed',inset:0,zIndex:150}} onClick={()=>setShowNotifs(false)}>
          <div onClick={e=>e.stopPropagation()} style={{position:'fixed',top:0,[t.dir==='rtl'?'left':'right']:0,width:'340px',maxWidth:'92vw',height:'100vh',background:'#0f0f0f',borderLeft:t.dir==='rtl'?'none':'1px solid #1a1a1a',borderRight:t.dir==='rtl'?'1px solid #1a1a1a':'none',display:'flex',flexDirection:'column',direction:t.dir}}>
            <div style={{padding:'22px 18px',borderBottom:'1px solid #1a1a1a',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <h3 style={{color:'#fff',fontWeight:'700',fontSize:'0.95rem'}}>{t.notifTitle}</h3>
              <div style={{display:'flex',gap:'10px'}}>
                {unread>0&&<button onClick={markRead} style={{background:'none',border:'none',color:'#555',fontSize:'0.7rem',cursor:'pointer',fontFamily:'inherit'}}>{t.markRead}</button>}
                <button onClick={()=>setShowNotifs(false)} style={{background:'none',border:'none',color:'#444',cursor:'pointer',fontSize:'1.1rem'}}>✕</button>
              </div>
            </div>
            <div style={{flex:1,overflowY:'auto',padding:'10px'}}>
              {notifs.length===0&&<div style={{textAlign:'center',padding:'48px 20px',color:'#2a2a2a'}}>
                <p style={{fontSize:'1.5rem',marginBottom:'8px'}}>🔔</p>
                <p style={{fontSize:'0.82rem'}}>{t.noNotifs}</p>
              </div>}
              {notifs.map(n=>{
                const f=fields.find(f=>f.id===n.note_id)
                return (
                  <div key={n.id} style={{padding:'13px',borderRadius:'9px',marginBottom:'5px',background:n.is_read?'transparent':'#141414',border:`1px solid ${n.is_read?'transparent':'#1e1e1e'}`}}>
                    <div style={{display:'flex',gap:'9px',alignItems:'flex-start'}}>
                      <div style={{width:'7px',height:'7px',borderRadius:'50%',background:n.is_read?'transparent':'#C8A97E',marginTop:'5px',flexShrink:0}}/>
                      <div>
                        <p style={{color:n.is_read?'#444':'#bbb',fontSize:'0.82rem',lineHeight:1.6,marginBottom:'3px'}}>
                          <span style={{color:'#C8A97E',fontWeight:'600'}}>{n.from_name}</span>{' '}
                          {n.type==='reply'?(lang==='ar'?'ردّ على تعليقك':'replied to your comment'):(lang==='ar'?'علّق على فكرتك':'commented on your idea')}
                        </p>
                        <p style={{color:'#333',fontSize:'0.68rem'}}>«{n.note_title}»</p>
                        <p style={{color:'#2a2a2a',fontSize:'0.64rem',marginTop:'2px'}}>{ago(n.created_at, lang)}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
