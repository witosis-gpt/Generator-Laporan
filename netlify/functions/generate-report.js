// Netlify Function
// Endpoint: /.netlify/functions/generate-report
// Menyimpan ANTHROPIC_API_KEY di server (env var), tidak pernah terekspos ke browser.

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'ANTHROPIC_API_KEY belum diset di environment variables.' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Body request tidak valid.' }) };
  }

  const { template, transcript, unitKerja } = body || {};

  if (!template || !transcript) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Template dan transkrip wajib diisi.' }) };
  }

  if (transcript.length > 400000) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Transkrip terlalu panjang (maks ~400.000 karakter).' }) };
  }

  const systemPrompt = `Anda adalah staf administrasi instansi pemerintah yang menyusun Laporan Kegiatan resmi berdasarkan transkrip rapat/kegiatan.

ATURAN:
- Ikuti PERSIS struktur, urutan, dan penomoran/heading dari TEMPLATE yang diberikan. Jangan menambah atau menghapus poin template.
- Isi setiap bagian template menggunakan informasi yang benar-benar ada di transkrip. Gunakan bahasa Indonesia baku/formal kedinasan.
- Jika suatu informasi (misalnya tanggal, tempat, atau nama peserta) tidak disebutkan eksplisit di transkrip, tulis "[perlu dilengkapi]" pada bagian itu -- JANGAN mengarang.
- Bagian "Uraian Kegiatan/Pembahasan" atau sejenisnya dirangkum secara sistematis dan kronologis, poin demi poin, bukan transkrip mentah.
- Jika transkrip sangat panjang, tetap rangkum SEMUA poin penting secara padat -- satu-dua kalimat per poin per narasumber/topik. Prioritaskan kelengkapan cakupan topik di atas kedetailan tiap topik, supaya laporan tetap tuntas sampai penutup dan tidak terpotong.
- Keluarkan HANYA teks laporan final sesuai format template, tanpa komentar tambahan, tanpa markdown heading (#).`;

  const userPrompt = `TEMPLATE FORMAT LAPORAN:\n${template}\n\n${
    unitKerja ? `UNIT KERJA/INSTANSI: ${unitKerja}\n\n` : ''
  }TRANSKRIP KEGIATAN:\n${transcript}\n\nSusun laporan kegiatan sesuai template di atas berdasarkan transkrip ini.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 16000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('Anthropic API error:', response.status, errBody);
      return { statusCode: 502, body: JSON.stringify({ error: `Anthropic API error (${response.status})` }) };
    }

    const data = await response.json();
    const text = (data.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();

    if (!text) {
      return { statusCode: 502, body: JSON.stringify({ error: 'Respons kosong dari model.' }) };
    }

    return { statusCode: 200, body: JSON.stringify({ report: text }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Terjadi kesalahan internal server.' }) };
  }
};
