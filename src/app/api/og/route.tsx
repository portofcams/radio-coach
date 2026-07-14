import { ImageResponse } from 'next/og'

export const runtime = 'nodejs'

// Dynamic share/OG image (1200×630). No params → branded default for every link.
// ?score=82&passed=47&rate=88&label=Checkride+Ready&cs=N42TG → personalized
// readiness card so a shared result previews the score (the viral loop).
// ?rank=3&stat=12&unit=day+streak&scope=Streak&cs=N42TG → leaderboard rank card.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const score = searchParams.get('score')
  const label = (searchParams.get('label') || '').slice(0, 40)
  const passed = searchParams.get('passed')
  const rate = searchParams.get('rate')
  const cs = (searchParams.get('cs') || '').slice(0, 12)
  const heading = (searchParams.get('title') || '').slice(0, 100)
  const rank = searchParams.get('rank')
  const stat = (searchParams.get('stat') || '').slice(0, 20)
  const unit = (searchParams.get('unit') || '').slice(0, 30)
  const rankScope = (searchParams.get('scope') || 'Leaderboard').slice(0, 20)
  const personalized = !!score
  const isRank = !personalized && !!rank

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between', background: '#06070a', color: '#ffffff',
          padding: '64px 72px', fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', fontSize: 34, fontWeight: 700, letterSpacing: 8, color: '#eef3f8' }}>CLEARSPAR</div>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: 24, color: '#19e07a' }}>
            <div style={{ display: 'flex', width: 14, height: 14, borderRadius: 7, background: '#19e07a', marginRight: 12 }} />
            COM 121.700
          </div>
        </div>

        {personalized ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', fontSize: 26, letterSpacing: 4, color: '#36d6e6' }}>{(cs ? cs + ' · ' : '') + 'RADIO READINESS'}</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', marginTop: 8 }}>
              <div style={{ display: 'flex', fontSize: 180, fontWeight: 800, color: '#f5a623', lineHeight: 1 }}>{score + '%'}</div>
              {label ? <div style={{ display: 'flex', fontSize: 46, color: '#ffffff', marginLeft: 30, marginBottom: 28 }}>{label}</div> : <div style={{ display: 'flex' }} />}
            </div>
            <div style={{ display: 'flex', fontSize: 30, color: '#aab3bf', marginTop: 10 }}>{(passed || '0') + ' scenarios passed' + (rate ? ' · ' + rate + '% pass rate' : '')}</div>
          </div>
        ) : isRank ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', fontSize: 26, letterSpacing: 4, color: '#36d6e6' }}>{(cs ? cs + ' · ' : '') + rankScope.toUpperCase() + ' LEADERBOARD'}</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', marginTop: 8 }}>
              <div style={{ display: 'flex', fontSize: 180, fontWeight: 800, color: '#f5a623', lineHeight: 1 }}>{'#' + rank}</div>
              {stat ? <div style={{ display: 'flex', fontSize: 46, color: '#ffffff', marginLeft: 30, marginBottom: 28 }}>{stat + (unit ? ' ' + unit : '')}</div> : <div style={{ display: 'flex' }} />}
            </div>
            <div style={{ display: 'flex', fontSize: 30, color: '#aab3bf', marginTop: 10 }}>Ranked on Clearspar Radio Trainer</div>
          </div>
        ) : heading ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', fontSize: 24, letterSpacing: 4, color: '#36d6e6', marginBottom: 20 }}>FIELD NOTES</div>
            <div style={{ display: 'flex', fontSize: 58, fontWeight: 700, lineHeight: 1.15, color: '#ffffff' }}>{heading}</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', fontSize: 74, fontWeight: 700, lineHeight: 1.1 }}>
              <div style={{ display: 'flex', color: '#ffffff' }}>Your radio calls,&nbsp;</div>
              <div style={{ display: 'flex', color: '#f5a623' }}>graded like a CFI.</div>
            </div>
            <div style={{ display: 'flex', fontSize: 32, color: '#aab3bf', marginTop: 20 }}>Free ATC readback training — AI grades every element. No mic, works offline.</div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', fontSize: 28, color: '#8b94a1' }}>clearsparradio.binnacleai.com</div>
          <div style={{ display: 'flex', fontSize: 22, color: '#5a626c' }}>FAA AIM phraseology · live grading</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  )
}
