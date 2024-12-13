const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

// Data sementara (bisa diganti dengan database nanti)
let peminjaman = [];
let disposisi = [];

// Endpoint untuk peminjaman
app.get('/peminjaman', (req, res) => {
  res.json(peminjaman);
});

app.put('/peminjaman/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const index = peminjaman.findIndex(p => p.id === parseInt(id));
  if (index !== -1) {
    peminjaman[index].status = status;
    res.json({ message: 'Status updated' });
  } else {
    res.status(404).json({ message: 'Peminjaman not found' });
  }
});

// Endpoint untuk disposisi
app.get('/disposisi', (req, res) => {
  res.json(disposisi);
});

app.post('/peminjaman/:id/disposisi', (req, res) => {
  const { id } = req.params;
  const { kepada } = req.body;
  
  const newDisposisi = {
    id: disposisi.length + 1,
    peminjaman_id: parseInt(id),
    kepada,
    created_at: new Date().toISOString()
  };
  
  disposisi.push(newDisposisi);
  res.status(201).json(newDisposisi);
});

app.get('/disposisi/:id', (req, res) => {
  const { id } = req.params;
  const disposisiItem = disposisi.find(d => d.id === parseInt(id));
  
  if (!disposisiItem) {
    return res.status(404).json({ message: 'Disposisi not found' });
  }

  // Gabungkan dengan data peminjaman
  const peminjamanData = peminjaman.find(p => p.id === disposisiItem.peminjaman_id);
  
  res.json({
    ...disposisiItem,
    ...peminjamanData
  });
});

app.put('/disposisi/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const index = disposisi.findIndex(d => d.id === parseInt(id));
  if (index !== -1) {
    disposisi[index].status_disposisi = status;
    res.json({ message: 'Status updated' });
  } else {
    res.status(404).json({ message: 'Disposisi not found' });
  }
});

// Endpoint untuk Wakil Dekan
app.get('/peminjaman/wadek', (req, res) => {
  // Filter peminjaman yang sudah didisposisi ke wakil dekan
  const wadekPeminjaman = peminjaman.filter(p => {
    const peminjamanDisposisi = disposisi.find(d => d.peminjaman_id === p.id);
    return peminjamanDisposisi && peminjamanDisposisi.kepada === 'wakil_dekan';
  });
  res.json(wadekPeminjaman);
});

app.get('/peminjaman/wadek/notifications', (req, res) => {
  // Ambil 5 disposisi terbaru untuk wakil dekan
  const recentDisposisi = disposisi
    .filter(d => d.kepada === 'wakil_dekan')
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  // Gabungkan dengan data peminjaman
  const notifications = recentDisposisi.map(d => {
    const peminjamanData = peminjaman.find(p => p.id === d.peminjaman_id);
    return {
      id: d.id,
      nama_organisasi: peminjamanData?.nama_organisasi,
      status: d.status_disposisi,
      created_at: d.created_at
    };
  });

  res.json(notifications);
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});