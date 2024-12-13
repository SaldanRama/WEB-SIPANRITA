import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { Modal, Button } from 'react-bootstrap'; // Import modal dan button dari React Bootstrap
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

export const PeminjamanPage = () => {
    const [events, setEvents] = useState([]);
    const [showModal, setShowModal] = useState(false); // Menyimpan status modal
    const [modalInfo, setModalInfo] = useState(null); // Menyimpan informasi yang akan ditampilkan di modal

    useEffect(() => {
        // Mendapatkan seluruh data peminjaman yang statusnya 'disetujui'
        axios.get('http://localhost:5000/peminjaman')
            .then(response => {
                const peminjamanData = response.data
                    .filter(peminjaman => peminjaman.status === 'disetujui')  // Filter status 'disetujui'
                    .map(peminjaman => {
                        const start = new Date(peminjaman.tanggal_mulai);
                        const end = new Date(peminjaman.tanggal_selesai);

                        // Menyesuaikan waktu mulai dan selesai dengan data waktu_mulai dan waktu_selesai
                        const [startHour, startMinute] = peminjaman.waktu_mulai.split(':');
                        const [endHour, endMinute] = peminjaman.waktu_selesai.split(':');

                        // Atur waktu mulai dan selesai
                        start.setHours(startHour, startMinute);
                        end.setHours(endHour, endMinute);

                        return {
                            start,
                            end,
                            title: `Fasilitas ${peminjaman.nama_fasilitas} dipinjam oleh ${peminjaman.nama_organisasi}`,
                            id_fasilitas: peminjaman.id_fasilitas,
                            status: peminjaman.status,
                            penanggung_jawab: peminjaman.penanggung_jawab,
                            waktu_mulai: peminjaman.waktu_mulai,
                            waktu_selesai: peminjaman.waktu_selesai,
                            tanggal_mulai: peminjaman.tanggal_mulai,
                            tanggal_selesai: peminjaman.tanggal_selesai
                        };
                    });
                setEvents(peminjamanData);
            })
            .catch(error => {
                console.error('There was an error fetching the peminjaman data!', error);
            });
    }, []);

    // Fungsi untuk menampilkan modal dengan informasi event
    const handleEventClick = (event) => {
        const info = `
            ${event.title.split('dipinjam oleh')[0]} dipinjam pada ${moment(event.tanggal_mulai).format('DD MMM YYYY')} pukul ${event.waktu_mulai} 
            - ${moment(event.tanggal_selesai).format('DD MMM YYYY')} pukul ${event.waktu_selesai}.
        `;
        setModalInfo(info);
        setShowModal(true); // Menampilkan modal
    };

    return (
        <div className="peminjaman-page p-5">
            <h2 className='fw-bolder'>PEMINJAMAN FASILITAS</h2>
            <div style={{ height: '500px' }}>
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    onSelectEvent={handleEventClick} // Ketika event diklik
                    selectable
                    views={['month', 'agenda']} // Memastikan tampilan yang diinginkan
                />
            </div>

            {/* Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Informasi Peminjaman Fasilitas</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>{modalInfo}</p> {/* Menampilkan informasi */}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>
                        Tutup
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default PeminjamanPage;
