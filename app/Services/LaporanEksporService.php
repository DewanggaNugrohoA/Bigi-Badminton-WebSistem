<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\BiayaOperasional;
use App\Models\Pembayaran;
use App\Models\Produk;
use App\Models\Reservasi;
use App\Models\Restock;
use App\Models\ReturVoid;
use App\Models\ShiftKasir;
use App\Models\StockOpname;
use App\Models\TransaksiPos;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\PageSetup;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * Service pembuat berkas ekspor laporan rekapitulasi operasional dan keuangan ke format spreadsheet (.xlsx).
 *
 * Mengagregasi data pendapatan sewa lapangan, transaksi kasir POS, audit log,
 * riwayat shift kasir, dan hasil pemeriksaan lapangan dalam satu workbook.
 */
class LaporanEksporService
{
    /**
     * Sanitasi input teks sel untuk mencegah kerentanan Formula Injection (CSV / Excel Injection / DDE).
     * Jika sebuah sel teks diawali karakter formula berbahaya seperti '=', '+', '-', '@', '|',
     * teks diawali dengan tanda petik tunggal (') agar dievaluasi oleh Excel murni sebagai literal string.
     */
    public function sanitizeText(?string $value): string
    {
        if ($value === null || $value === '') {
            return '';
        }

        $str = (string) $value;
        $trimmed = ltrim($str, " \t\r\n");
        if ($trimmed !== '') {
            $firstChar = $trimmed[0];
            if (in_array($firstChar, ['=', '+', '-', '@', '|', "\t", "\r"], true)) {
                return "'" . $str;
            }
        }

        return $str;
    }

    public function generateExcel(string $startDate, string $endDate, User $adminUser, ?int $idLapangan = null): Spreadsheet
    {
        $posSelesai = TransaksiPos::query()
            ->whereDate('tanggal', '>=', $startDate)
            ->whereDate('tanggal', '<=', $endDate)
            ->where('status_transaksi', TransaksiPos::STATUS_SELESAI)
            ->selectRaw('
                COALESCE(SUM(total), 0) as total_pos,
                COALESCE(SUM(CASE WHEN metode_bayar = "tunai" THEN total ELSE 0 END), 0) as total_tunai,
                COALESCE(SUM(CASE WHEN metode_bayar = "qris" THEN total ELSE 0 END), 0) as total_qris
            ')
            ->first();

        $pendapatanPos = (float) ($posSelesai->total_pos ?? 0);
        $posTunai = (float) ($posSelesai->total_tunai ?? 0);
        $posQris = (float) ($posSelesai->total_qris ?? 0);

        $sewaValidAgg = Pembayaran::query()
            ->leftJoin('reservasi', 'pembayaran.id_reservasi', '=', 'reservasi.id_reservasi')
            ->leftJoin('paket_member', 'pembayaran.id_paket', '=', 'paket_member.id_paket')
            ->where('pembayaran.status_pembayaran', Pembayaran::STATUS_TERKONFIRMASI)
            ->where(function ($q) {
                $q->where(function ($qRes) {
                    $qRes->whereNotNull('pembayaran.id_reservasi')
                        ->where('reservasi.status_reservasi', '!=', Reservasi::STATUS_BATAL);
                })->orWhere(function ($qPkt) {
                    $qPkt->whereNotNull('pembayaran.id_paket')
                        ->where('paket_member.status', '!=', \App\Models\PaketMember::STATUS_DIBATALKAN);
                });
            })
            ->whereDate('pembayaran.tanggal_pembayaran', '>=', $startDate)
            ->whereDate('pembayaran.tanggal_pembayaran', '<=', $endDate)
            ->selectRaw('
                COALESCE(SUM(pembayaran.jumlah), 0) as total_sewa,
                COALESCE(SUM(CASE WHEN pembayaran.jenis_pembayaran = "DP" THEN pembayaran.jumlah ELSE 0 END), 0) as dp,
                COALESCE(SUM(CASE WHEN pembayaran.jenis_pembayaran = "Lunas" THEN pembayaran.jumlah ELSE 0 END), 0) as lunas
            ')
            ->first();

        $pendapatanSewa = (float) ($sewaValidAgg->total_sewa ?? 0);
        $sewaDp = (float) ($sewaValidAgg->dp ?? 0);
        $sewaLunas = (float) ($sewaValidAgg->lunas ?? 0);
        $totalPendapatan = $pendapatanPos + $pendapatanSewa;

        $returVoidAgg = ReturVoid::query()
            ->join('transaksi_pos', 'retur_void.id_transaksi', '=', 'transaksi_pos.id_transaksi')
            ->whereDate('retur_void.tanggal', '>=', $startDate)
            ->whereDate('retur_void.tanggal', '<=', $endDate)
            ->selectRaw('
                COUNT(retur_void.id_retur) as total_kasus,
                COALESCE(SUM(transaksi_pos.total), 0) as total_nominal
            ')
            ->first();

        $jumlahVoidRetur = (int) ($returVoidAgg->total_kasus ?? 0);
        $totalNominalVoidRetur = (float) ($returVoidAgg->total_nominal ?? 0);

        $shiftAgg = ShiftKasir::query()
            ->whereDate('waktu_buka', '>=', $startDate)
            ->whereDate('waktu_buka', '<=', $endDate)
            ->selectRaw('COALESCE(SUM(selisih), 0) as total_selisih')
            ->first();
        $totalSelisihShift = (float) ($shiftAgg->total_selisih ?? 0);

        $sisaTagihan = (float) Reservasi::query()
            ->where('status_reservasi', Reservasi::STATUS_TERKONFIRMASI)
            ->whereDate('tanggal_pemesanan', '>=', $startDate)
            ->whereDate('tanggal_pemesanan', '<=', $endDate)
            ->selectRaw('
                COALESCE(SUM(
                    GREATEST(0, total_biaya - COALESCE((
                        SELECT SUM(jumlah) FROM pembayaran 
                        WHERE pembayaran.id_reservasi = reservasi.id_reservasi 
                        AND pembayaran.status_pembayaran = ?
                    ), 0))
                ), 0) as sisa_tagihan
            ', [Pembayaran::STATUS_TERKONFIRMASI])
            ->value('sisa_tagihan');

        $dpBatal = (float) Pembayaran::query()
            ->join('reservasi', 'pembayaran.id_reservasi', '=', 'reservasi.id_reservasi')
            ->where('pembayaran.status_pembayaran', Pembayaran::STATUS_TERKONFIRMASI)
            ->where('reservasi.status_reservasi', Reservasi::STATUS_BATAL)
            ->whereDate('pembayaran.tanggal_pembayaran', '>=', $startDate)
            ->whereDate('pembayaran.tanggal_pembayaran', '<=', $endDate)
            ->sum('pembayaran.jumlah');

        $biayaOperasional = (float) BiayaOperasional::query()
            ->whereDate('tanggal_biaya', '>=', $startDate)
            ->whereDate('tanggal_biaya', '<=', $endDate)
            ->sum('jumlah');

        $labaBersih = $totalPendapatan - $biayaOperasional;

        $spreadsheet = new Spreadsheet();
        $spreadsheet->removeSheetByIndex(0);

        $this->buildSheetRingkasan($spreadsheet, [
            'startDate' => $startDate,
            'endDate' => $endDate,
            'adminNama' => $adminUser->nama,
            'pendapatanPos' => $pendapatanPos,
            'posTunai' => $posTunai,
            'posQris' => $posQris,
            'pendapatanSewa' => $pendapatanSewa,
            'sewaDp' => $sewaDp,
            'sewaLunas' => $sewaLunas,
            'totalPendapatan' => $totalPendapatan,
            'biayaOperasional' => $biayaOperasional,
            'labaBersih' => $labaBersih,
            'jumlahVoidRetur' => $jumlahVoidRetur,
            'totalNominalVoidRetur' => $totalNominalVoidRetur,
            'totalSelisihShift' => $totalSelisihShift,
            'sisaTagihan' => $sisaTagihan,
            'dpBatal' => $dpBatal,
        ]);

        $this->buildSheetPosHarian($spreadsheet, $startDate, $endDate);
        $this->buildSheetRekapShift($spreadsheet, $startDate, $endDate);
        $this->buildSheetVoidRetur($spreadsheet, $startDate, $endDate);
        $this->buildSheetSewaLapangan($spreadsheet, $startDate, $endDate);
        $this->buildSheetRestock($spreadsheet, $startDate, $endDate);
        $this->buildSheetOpname($spreadsheet, $startDate, $endDate);
        $this->buildSheetStokMenipis($spreadsheet);
        $this->buildSheetPemain($spreadsheet, $startDate, $endDate);
        $this->buildSheetLapangan($spreadsheet, $startDate, $endDate, $idLapangan);

        $spreadsheet->setActiveSheetIndex(0);

        AuditLog::create([
            'id_user' => $adminUser->id_user,
            'aksi' => 'EKSPOR_LAPORAN',
            'objek' => 'laporan_keuangan',
            'keterangan' => "Mengekspor laporan keuangan periode {$startDate} s.d. {$endDate} ke Excel (.xlsx)",
            'waktu' => Carbon::now('Asia/Jakarta'),
        ]);

        return $spreadsheet;
    }

    private function applySheetStyles(Worksheet $sheet, string $highestCol, int $headerRow = 1): void
    {
        $sheet->setShowGridLines(false);
        $sheet->getPageSetup()->setOrientation(PageSetup::ORIENTATION_LANDSCAPE);
        $sheet->getPageSetup()->setFitToWidth(1);
        $sheet->getPageSetup()->setFitToHeight(0);

        $headerRange = "A{$headerRow}:{$highestCol}{$headerRow}";
        $sheet->getStyle($headerRange)->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => '1F2937']],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => 'E5E7EB'],
            ],
            'borders' => [
                'bottom' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '9CA3AF']],
            ],
        ]);

        $sheet->freezePane("A" . ($headerRow + 1));
    }

    private function autoFitColumns(Worksheet $sheet, array $columns): void
    {
        foreach ($columns as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }
    }

    private function buildSheetRingkasan(Spreadsheet $spreadsheet, array $data): void
    {
        $sheet = new Worksheet($spreadsheet, 'Ringkasan');
        $spreadsheet->addSheet($sheet);

        $sheet->setShowGridLines(false);
        $sheet->getPageSetup()->setOrientation(PageSetup::ORIENTATION_LANDSCAPE);
        $sheet->getPageSetup()->setFitToWidth(1);
        $sheet->getPageSetup()->setFitToHeight(0);

        $sheet->setCellValue('A1', 'BIGI BADMINTON - LAPORAN EKSEKUTIF KEUANGAN');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);

        $periodeStr = Carbon::parse($data['startDate'])->format('d/m/Y') . ' - ' . Carbon::parse($data['endDate'])->format('d/m/Y');
        $sheet->setCellValue('A2', 'Periode: ' . $periodeStr);
        $sheet->setCellValue('A3', 'Waktu Cetak: ' . Carbon::now('Asia/Jakarta')->format('d/m/Y H:i:s'));
        $sheet->setCellValue('A4', 'Nama Admin: ' . $this->sanitizeText($data['adminNama']));
        $sheet->getStyle('A2:A4')->getFont()->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('4B5563'));

        $sheet->setCellValue('A6', 'KETERANGAN');
        $sheet->setCellValue('B6', 'RINCIAN / CATATAN');
        $sheet->setCellValue('C6', 'NOMINAL (RP)');
        $sheet->getStyle('A6:C6')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => '1F2937']],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => 'E5E7EB'],
            ],
            'borders' => [
                'bottom' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '9CA3AF']],
            ],
        ]);

        $rows = [
            ['PENDAPATAN', '', ''],
            ['  Pendapatan POS', 'Transaksi kasir selesai', $data['pendapatanPos']],
            ['    - Tunai', 'Metode bayar tunai', $data['posTunai']],
            ['    - QRIS', 'Metode bayar QRIS', $data['posQris']],
            ['  Pendapatan Sewa Lapangan', 'Pembayaran sewa terkonfirmasi (tidak batal)', $data['pendapatanSewa']],
            ['    - DP', 'Uang muka sewa', $data['sewaDp']],
            ['    - Lunas', 'Pelunasan sewa', $data['sewaLunas']],
            ['TOTAL PENDAPATAN (POS + SEWA)', 'Akumulasi pendapatan riil masuk', $data['totalPendapatan']],
            ['KOREKSI KAS', '', ''],
            ['  Total Nilai Void & Retur', $data['jumlahVoidRetur'] . ' kasus pembatalan kasir', $data['totalNominalVoidRetur']],
            ['  Total Selisih Kas Shift', 'Akumulasi selisih fisik vs sistem kasir', $data['totalSelisihShift']],
            ['DI LUAR TOTAL PENDAPATAN', '', ''],
            ['  Piutang Sewa (Belum Lunas)', 'Sisa tagihan reservasi terkonfirmasi', $data['sisaTagihan']],
            ['  DP Reservasi Batal', 'Pembayaran sewa pada reservasi yang dibatalkan', $data['dpBatal']],
            ['PENGELUARAN OPERASIONAL & LABA BERSIH', '', ''],
            ['  Total Biaya Operasional', 'Beban operasional (listrik, wifi, gas, dll)', $data['biayaOperasional']],
            ['LABA BERSIH (NETTO)', 'Total pendapatan kotor dikurangi biaya operasional', $data['labaBersih']],
        ];

        $r = 7;
        foreach ($rows as $item) {
            $sheet->setCellValue("A{$r}", $item[0]);
            $sheet->setCellValue("B{$r}", $item[1]);
            if ($item[2] !== '') {
                $sheet->setCellValueExplicit("C{$r}", $item[2], DataType::TYPE_NUMERIC);
                $sheet->getStyle("C{$r}")->getNumberFormat()->setFormatCode('#,##0');
            }

            if (in_array($item[0], ['PENDAPATAN', 'KOREKSI KAS', 'DI LUAR TOTAL PENDAPATAN', 'PENGELUARAN OPERASIONAL & LABA BERSIH'], true)) {
                $sheet->getStyle("A{$r}:C{$r}")->getFont()->setBold(true)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('374151'));
                $sheet->getStyle("A{$r}:C{$r}")->getBorders()->getBottom()->setBorderStyle(Border::BORDER_HAIR);
            }

            if (in_array($item[0], ['TOTAL PENDAPATAN (POS + SEWA)', 'LABA BERSIH (NETTO)'], true)) {
                $sheet->getStyle("A{$r}:C{$r}")->applyFromArray([
                    'font' => ['bold' => true, 'color' => ['rgb' => '111827']],
                    'borders' => [
                        'top' => ['borderStyle' => Border::BORDER_DOUBLE, 'color' => ['rgb' => '374151']],
                        'bottom' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '374151']],
                    ],
                ]);
            }

            $r++;
        }

        $sheet->setCellValue("A" . ($r + 1), 'Catatan: Piutang sewa belum lunas dan DP reservasi batal tidak termasuk ke dalam kalkulasi total pendapatan.');
        $sheet->getStyle("A" . ($r + 1))->getFont()->setItalic(true)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('6B7280'))->setSize(9);

        $this->autoFitColumns($sheet, ['A', 'B', 'C']);
        $sheet->getStyle('C7:C' . ($r - 1))->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
    }

    private function buildSheetPosHarian(Spreadsheet $spreadsheet, string $startDate, string $endDate): void
    {
        $sheet = new Worksheet($spreadsheet, 'POS Harian');
        $spreadsheet->addSheet($sheet);

        $sheet->setCellValue('A1', 'Tanggal');
        $sheet->setCellValue('B1', 'Jumlah Transaksi');
        $sheet->setCellValue('C1', 'Tunai (Rp)');
        $sheet->setCellValue('D1', 'QRIS (Rp)');
        $sheet->setCellValue('E1', 'Total Pendapatan (Rp)');

        $this->applySheetStyles($sheet, 'E', 1);

        $data = TransaksiPos::query()
            ->where('status_transaksi', TransaksiPos::STATUS_SELESAI)
            ->whereDate('tanggal', '>=', $startDate)
            ->whereDate('tanggal', '<=', $endDate)
            ->selectRaw('
                DATE(tanggal) as tgl,
                COUNT(id_transaksi) as total_transaksi,
                COALESCE(SUM(CASE WHEN metode_bayar = "tunai" THEN total ELSE 0 END), 0) as tunai,
                COALESCE(SUM(CASE WHEN metode_bayar = "qris" THEN total ELSE 0 END), 0) as qris,
                COALESCE(SUM(total), 0) as total
            ')
            ->groupBy(DB::raw('DATE(tanggal)'))
            ->orderBy('tgl', 'asc')
            ->cursor();

        $row = 2;
        foreach ($data as $item) {
            $sheet->setCellValue("A{$row}", Carbon::parse($item->tgl)->format('d/m/Y'));
            $sheet->setCellValueExplicit("B{$row}", (int) $item->total_transaksi, DataType::TYPE_NUMERIC);
            $sheet->setCellValueExplicit("C{$row}", (float) $item->tunai, DataType::TYPE_NUMERIC);
            $sheet->setCellValueExplicit("D{$row}", (float) $item->qris, DataType::TYPE_NUMERIC);
            $sheet->setCellValueExplicit("E{$row}", (float) $item->total, DataType::TYPE_NUMERIC);

            $sheet->getStyle("B{$row}")->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle("C{$row}:E{$row}")->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle("A{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("B{$row}:E{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);

            $row++;
        }

        if ($row > 2) {
            $lastDataRow = $row - 1;
            $sheet->setCellValue("A{$row}", 'Total');
            $sheet->setCellValue("B{$row}", "=SUM(B2:B{$lastDataRow})");
            $sheet->setCellValue("C{$row}", "=SUM(C2:C{$lastDataRow})");
            $sheet->setCellValue("D{$row}", "=SUM(D2:D{$lastDataRow})");
            $sheet->setCellValue("E{$row}", "=SUM(E2:E{$lastDataRow})");

            $sheet->getStyle("A{$row}:E{$row}")->applyFromArray([
                'font' => ['bold' => true],
                'borders' => [
                    'top' => ['borderStyle' => Border::BORDER_THIN],
                    'bottom' => ['borderStyle' => Border::BORDER_DOUBLE],
                ],
            ]);
            $sheet->getStyle("B{$row}:E{$row}")->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle("B{$row}:E{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
        }

        $this->autoFitColumns($sheet, ['A', 'B', 'C', 'D', 'E']);
    }

    private function buildSheetRekapShift(Spreadsheet $spreadsheet, string $startDate, string $endDate): void
    {
        $sheet = new Worksheet($spreadsheet, 'Rekap Shift');
        $spreadsheet->addSheet($sheet);

        $headers = ['Kasir', 'Waktu Buka', 'Waktu Tutup', 'Modal Awal (Rp)', 'Kas Sistem (Rp)', 'Kas Fisik (Rp)', 'Selisih (Rp)', 'Status'];
        $cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        foreach ($headers as $idx => $h) {
            $sheet->setCellValue($cols[$idx] . '1', $h);
        }

        $this->applySheetStyles($sheet, 'H', 1);

        $shifts = ShiftKasir::with('user:id_user,nama')
            ->whereDate('waktu_buka', '>=', $startDate)
            ->whereDate('waktu_buka', '<=', $endDate)
            ->orderBy('waktu_buka', 'asc')
            ->cursor();

        $row = 2;
        foreach ($shifts as $s) {
            $sheet->setCellValueExplicit("A{$row}", $this->sanitizeText($s->user?->nama ?? 'Kasir'), DataType::TYPE_STRING);
            $sheet->setCellValue("B{$row}", Carbon::parse($s->waktu_buka)->format('d/m/Y H:i'));
            $sheet->setCellValue("C{$row}", $s->waktu_tutup ? Carbon::parse($s->waktu_tutup)->format('d/m/Y H:i') : 'Terbuka');
            $sheet->setCellValueExplicit("D{$row}", (float) $s->modal_awal, DataType::TYPE_NUMERIC);
            $sheet->setCellValueExplicit("E{$row}", (float) ($s->kas_sistem ?? 0), DataType::TYPE_NUMERIC);
            $sheet->setCellValueExplicit("F{$row}", (float) ($s->kas_fisik ?? 0), DataType::TYPE_NUMERIC);
            $sheet->setCellValueExplicit("G{$row}", (float) ($s->selisih ?? 0), DataType::TYPE_NUMERIC);
            $sheet->setCellValueExplicit("H{$row}", ucfirst($s->status), DataType::TYPE_STRING);

            $sheet->getStyle("D{$row}:G{$row}")->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle("D{$row}:G{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
            $sheet->getStyle("H{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

            $row++;
        }

        if ($row > 2) {
            $lastDataRow = $row - 1;
            $sheet->setCellValue("A{$row}", 'Total');
            $sheet->setCellValue("D{$row}", "=SUM(D2:D{$lastDataRow})");
            $sheet->setCellValue("E{$row}", "=SUM(E2:E{$lastDataRow})");
            $sheet->setCellValue("F{$row}", "=SUM(F2:F{$lastDataRow})");
            $sheet->setCellValue("G{$row}", "=SUM(G2:G{$lastDataRow})");

            $sheet->getStyle("A{$row}:H{$row}")->applyFromArray([
                'font' => ['bold' => true],
                'borders' => [
                    'top' => ['borderStyle' => Border::BORDER_THIN],
                    'bottom' => ['borderStyle' => Border::BORDER_DOUBLE],
                ],
            ]);
            $sheet->getStyle("D{$row}:G{$row}")->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle("D{$row}:G{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
        }

        $this->autoFitColumns($sheet, $cols);
    }

    private function buildSheetVoidRetur(Spreadsheet $spreadsheet, string $startDate, string $endDate): void
    {
        $sheet = new Worksheet($spreadsheet, 'Void-Retur');
        $spreadsheet->addSheet($sheet);

        $headers = ['Waktu', 'No Transaksi', 'Kasir', 'Jenis', 'Alasan', 'Total Nilai (Rp)', 'Status'];
        $cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
        foreach ($headers as $idx => $h) {
            $sheet->setCellValue($cols[$idx] . '1', $h);
        }

        $this->applySheetStyles($sheet, 'G', 1);

        $voids = ReturVoid::with(['transaksiPos', 'pengaju:id_user,nama'])
            ->whereDate('tanggal', '>=', $startDate)
            ->whereDate('tanggal', '<=', $endDate)
            ->orderBy('tanggal', 'asc')
            ->cursor();

        $row = 2;
        foreach ($voids as $v) {
            $sheet->setCellValue("A{$row}", Carbon::parse($v->tanggal)->format('d/m/Y H:i'));
            $sheet->setCellValueExplicit("B{$row}", $this->sanitizeText($v->transaksiPos?->no_transaksi ?? '-'), DataType::TYPE_STRING);
            $sheet->setCellValueExplicit("C{$row}", $this->sanitizeText($v->pengaju?->nama ?? '-'), DataType::TYPE_STRING);
            $sheet->setCellValueExplicit("D{$row}", strtoupper($v->jenis), DataType::TYPE_STRING);
            $sheet->setCellValueExplicit("E{$row}", $this->sanitizeText($v->alasan), DataType::TYPE_STRING);
            $sheet->setCellValueExplicit("F{$row}", (float) ($v->transaksiPos?->total ?? 0), DataType::TYPE_NUMERIC);
            $sheet->setCellValueExplicit("G{$row}", 'Dicatat kasir', DataType::TYPE_STRING);

            $sheet->getStyle("F{$row}")->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle("F{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
            $sheet->getStyle("D{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

            $row++;
        }

        if ($row > 2) {
            $lastDataRow = $row - 1;
            $sheet->setCellValue("A{$row}", 'Total');
            $sheet->setCellValue("F{$row}", "=SUM(F2:F{$lastDataRow})");

            $sheet->getStyle("A{$row}:G{$row}")->applyFromArray([
                'font' => ['bold' => true],
                'borders' => [
                    'top' => ['borderStyle' => Border::BORDER_THIN],
                    'bottom' => ['borderStyle' => Border::BORDER_DOUBLE],
                ],
            ]);
            $sheet->getStyle("F{$row}")->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle("F{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
        }

        $this->autoFitColumns($sheet, $cols);
    }

    private function buildSheetSewaLapangan(Spreadsheet $spreadsheet, string $startDate, string $endDate): void
    {
        $sheet = new Worksheet($spreadsheet, 'Sewa Lapangan');
        $spreadsheet->addSheet($sheet);

        $headers = ['Tanggal Bayar', 'ID Reservasi', 'Pemesan', 'Jenis Bayar', 'Metode Bayar', 'Jumlah (Rp)', 'Status Bayar', 'Status Reservasi', 'Keterangan'];
        $cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
        foreach ($headers as $idx => $h) {
            $sheet->setCellValue($cols[$idx] . '1', $h);
        }

        $this->applySheetStyles($sheet, 'I', 1);

        $pembayaran = Pembayaran::with(['reservasi.user', 'paket.user'])
            ->whereDate('tanggal_pembayaran', '>=', $startDate)
            ->whereDate('tanggal_pembayaran', '<=', $endDate)
            ->orderBy('tanggal_pembayaran', 'asc')
            ->cursor();

        $row = 2;
        foreach ($pembayaran as $p) {
            $res = $p->reservasi;
            $namaPemesan = $res?->nama_pemesan ?: ($res?->user?->nama ?: ($p->paket?->user?->nama ?: 'Pelanggan'));
            $refId = $p->id_reservasi ? ('#' . $p->id_reservasi) : ('Paket #' . $p->id_paket);
            $statusSewa = $res ? ucfirst($res->status_reservasi) : ucfirst($p->paket?->status ?? 'Aktif');

            $sheet->setCellValue("A{$row}", Carbon::parse($p->tanggal_pembayaran)->format('d/m/Y'));
            $sheet->setCellValueExplicit("B{$row}", $refId, DataType::TYPE_STRING);
            $sheet->setCellValueExplicit("C{$row}", $this->sanitizeText($namaPemesan), DataType::TYPE_STRING);
            $sheet->setCellValueExplicit("D{$row}", $p->jenis_pembayaran, DataType::TYPE_STRING);
            $sheet->setCellValueExplicit("E{$row}", strtoupper($p->metode_pembayaran), DataType::TYPE_STRING);
            $sheet->setCellValueExplicit("F{$row}", (float) $p->jumlah, DataType::TYPE_NUMERIC);
            $sheet->setCellValueExplicit("G{$row}", ucfirst($p->status_pembayaran), DataType::TYPE_STRING);
            $sheet->setCellValueExplicit("H{$row}", $statusSewa, DataType::TYPE_STRING);
            $sheet->setCellValueExplicit("I{$row}", $this->sanitizeText($p->keterangan ?? '-'), DataType::TYPE_STRING);

            $sheet->getStyle("F{$row}")->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle("F{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
            $sheet->getStyle("D{$row}:E{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("G{$row}:H{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

            $row++;
        }

        if ($row > 2) {
            $lastDataRow = $row - 1;
            $sheet->setCellValue("A{$row}", 'Total');
            $sheet->setCellValue("F{$row}", "=SUM(F2:F{$lastDataRow})");

            $sheet->getStyle("A{$row}:I{$row}")->applyFromArray([
                'font' => ['bold' => true],
                'borders' => [
                    'top' => ['borderStyle' => Border::BORDER_THIN],
                    'bottom' => ['borderStyle' => Border::BORDER_DOUBLE],
                ],
            ]);
            $sheet->getStyle("F{$row}")->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle("F{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
        }

        $this->autoFitColumns($sheet, $cols);
    }

    private function buildSheetRestock(Spreadsheet $spreadsheet, string $startDate, string $endDate): void
    {
        $sheet = new Worksheet($spreadsheet, 'Restock');
        $spreadsheet->addSheet($sheet);

        $headers = ['Tanggal', 'Produk', 'Jumlah Masuk', 'Kasir', 'Keterangan'];
        $cols = ['A', 'B', 'C', 'D', 'E'];
        foreach ($headers as $idx => $h) {
            $sheet->setCellValue($cols[$idx] . '1', $h);
        }

        $this->applySheetStyles($sheet, 'E', 1);

        $restocks = Restock::with(['produk:id_produk,nama_produk', 'user:id_user,nama'])
            ->whereDate('tanggal', '>=', $startDate)
            ->whereDate('tanggal', '<=', $endDate)
            ->orderBy('tanggal', 'asc')
            ->cursor();

        $row = 2;
        foreach ($restocks as $r) {
            $sheet->setCellValue("A{$row}", Carbon::parse($r->tanggal)->format('d/m/Y'));
            $sheet->setCellValueExplicit("B{$row}", $this->sanitizeText($r->produk?->nama_produk ?? '-'), DataType::TYPE_STRING);
            $sheet->setCellValueExplicit("C{$row}", (int) $r->jumlah, DataType::TYPE_NUMERIC);
            $sheet->setCellValueExplicit("D{$row}", $this->sanitizeText($r->user?->nama ?? 'Kasir'), DataType::TYPE_STRING);
            $sheet->setCellValueExplicit("E{$row}", $this->sanitizeText($r->keterangan ?? '-'), DataType::TYPE_STRING);

            $sheet->getStyle("C{$row}")->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle("C{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);

            $row++;
        }

        if ($row > 2) {
            $lastDataRow = $row - 1;
            $sheet->setCellValue("A{$row}", 'Total');
            $sheet->setCellValue("C{$row}", "=SUM(C2:C{$lastDataRow})");

            $sheet->getStyle("A{$row}:E{$row}")->applyFromArray([
                'font' => ['bold' => true],
                'borders' => [
                    'top' => ['borderStyle' => Border::BORDER_THIN],
                    'bottom' => ['borderStyle' => Border::BORDER_DOUBLE],
                ],
            ]);
            $sheet->getStyle("C{$row}")->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle("C{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
        }

        $this->autoFitColumns($sheet, $cols);
    }

    private function buildSheetOpname(Spreadsheet $spreadsheet, string $startDate, string $endDate): void
    {
        $sheet = new Worksheet($spreadsheet, 'Stok Opname');
        $spreadsheet->addSheet($sheet);

        $headers = ['Tanggal', 'Produk', 'Stok Sistem', 'Stok Fisik', 'Selisih Unit', 'Kasir', 'Keterangan'];
        $cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
        foreach ($headers as $idx => $h) {
            $sheet->setCellValue($cols[$idx] . '1', $h);
        }

        $this->applySheetStyles($sheet, 'G', 1);

        $opnames = StockOpname::with(['produk:id_produk,nama_produk', 'user:id_user,nama'])
            ->whereDate('tanggal', '>=', $startDate)
            ->whereDate('tanggal', '<=', $endDate)
            ->orderBy('tanggal', 'asc')
            ->cursor();

        $row = 2;
        foreach ($opnames as $o) {
            $sheet->setCellValue("A{$row}", Carbon::parse($o->tanggal)->format('d/m/Y'));
            $sheet->setCellValueExplicit("B{$row}", $this->sanitizeText($o->produk?->nama_produk ?? '-'), DataType::TYPE_STRING);
            $sheet->setCellValueExplicit("C{$row}", (int) $o->stok_sistem, DataType::TYPE_NUMERIC);
            $sheet->setCellValueExplicit("D{$row}", (int) $o->stok_fisik, DataType::TYPE_NUMERIC);
            $sheet->setCellValueExplicit("E{$row}", (int) $o->selisih, DataType::TYPE_NUMERIC);
            $sheet->setCellValueExplicit("F{$row}", $this->sanitizeText($o->user?->nama ?? 'Kasir'), DataType::TYPE_STRING);
            $sheet->setCellValueExplicit("G{$row}", $this->sanitizeText($o->keterangan ?? '-'), DataType::TYPE_STRING);

            $sheet->getStyle("C{$row}:E{$row}")->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle("C{$row}:E{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);

            $row++;
        }

        if ($row > 2) {
            $lastDataRow = $row - 1;
            $sheet->setCellValue("A{$row}", 'Total');
            $sheet->setCellValue("C{$row}", "=SUM(C2:C{$lastDataRow})");
            $sheet->setCellValue("D{$row}", "=SUM(D2:D{$lastDataRow})");
            $sheet->setCellValue("E{$row}", "=SUM(E2:E{$lastDataRow})");

            $sheet->getStyle("A{$row}:G{$row}")->applyFromArray([
                'font' => ['bold' => true],
                'borders' => [
                    'top' => ['borderStyle' => Border::BORDER_THIN],
                    'bottom' => ['borderStyle' => Border::BORDER_DOUBLE],
                ],
            ]);
            $sheet->getStyle("C{$row}:E{$row}")->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle("C{$row}:E{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
        }

        $this->autoFitColumns($sheet, $cols);
    }

    private function buildSheetStokMenipis(Spreadsheet $spreadsheet): void
    {
        $sheet = new Worksheet($spreadsheet, 'Stok Menipis');
        $spreadsheet->addSheet($sheet);

        $headers = ['Nama Produk', 'Kategori', 'Stok Saat Ini', 'Batas Minimum', 'Status Stok'];
        $cols = ['A', 'B', 'C', 'D', 'E'];
        foreach ($headers as $idx => $h) {
            $sheet->setCellValue($cols[$idx] . '1', $h);
        }

        $this->applySheetStyles($sheet, 'E', 1);

        $produks = Produk::query()
            ->where('status_produk', Produk::STATUS_AKTIF)
            ->whereColumn('stok', '<=', 'stok_minimum')
            ->orderBy('stok', 'asc')
            ->cursor();

        $row = 2;
        foreach ($produks as $p) {
            $sheet->setCellValueExplicit("A{$row}", $this->sanitizeText($p->nama_produk), DataType::TYPE_STRING);
            $sheet->setCellValueExplicit("B{$row}", $this->sanitizeText($p->kategori), DataType::TYPE_STRING);
            $sheet->setCellValueExplicit("C{$row}", (int) $p->stok, DataType::TYPE_NUMERIC);
            $sheet->setCellValueExplicit("D{$row}", (int) $p->stok_minimum, DataType::TYPE_NUMERIC);
            $sheet->setCellValueExplicit("E{$row}", $p->stok === 0 ? 'Habis' : 'Menipis', DataType::TYPE_STRING);

            $sheet->getStyle("C{$row}:D{$row}")->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle("C{$row}:D{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
            $sheet->getStyle("E{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

            $row++;
        }

        $this->autoFitColumns($sheet, $cols);
    }

    private function buildSheetPemain(Spreadsheet $spreadsheet, string $startDate, string $endDate): void
    {
        $sheet = new Worksheet($spreadsheet, 'Pemain');
        $spreadsheet->addSheet($sheet);

        $headers = [
            'Nama',
            'WhatsApp',
            'Jenis',
            'Sisa Sesi Paket',
            'Kunjungan (Periode)',
            'Open Mabar Dibuat',
            'Open Mabar Diikuti',
            'Kunjungan Terakhir',
        ];
        $cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        foreach ($headers as $idx => $h) {
            $sheet->setCellValue($cols[$idx] . '1', $h);
        }

        $this->applySheetStyles($sheet, 'H', 1);

        $pemainService = new LaporanPemainService();
        $pemainList = $pemainService->getSemuaPemain($startDate, $endDate, null);

        $row = 2;
        foreach ($pemainList as $p) {
            $sheet->setCellValueExplicit("A{$row}", $this->sanitizeText($p['nama']), DataType::TYPE_STRING);
            $sheet->setCellValueExplicit("B{$row}", $this->sanitizeText($p['no_whatsapp'] ?? '-'), DataType::TYPE_STRING);
            $sheet->setCellValueExplicit("C{$row}", $this->sanitizeText($p['jenis_label']), DataType::TYPE_STRING);

            if ($p['sisa_sesi_paket'] !== null) {
                $sheet->setCellValueExplicit("D{$row}", (int) $p['sisa_sesi_paket'], DataType::TYPE_NUMERIC);
                $sheet->getStyle("D{$row}")->getNumberFormat()->setFormatCode('#,##0');
            } else {
                $sheet->setCellValueExplicit("D{$row}", '-', DataType::TYPE_STRING);
            }

            $sheet->setCellValueExplicit("E{$row}", (int) $p['kunjungan_periode'], DataType::TYPE_NUMERIC);
            $sheet->getStyle("E{$row}")->getNumberFormat()->setFormatCode('#,##0');

            $sheet->setCellValueExplicit("F{$row}", (int) $p['open_mabar_dibuat'], DataType::TYPE_NUMERIC);
            $sheet->getStyle("F{$row}")->getNumberFormat()->setFormatCode('#,##0');

            $sheet->setCellValueExplicit("G{$row}", (int) $p['open_mabar_diikuti'], DataType::TYPE_NUMERIC);
            $sheet->getStyle("G{$row}")->getNumberFormat()->setFormatCode('#,##0');

            $kunjunganTerakhirStr = $p['kunjungan_terakhir']
                ? Carbon::parse($p['kunjungan_terakhir'])->format('d/m/Y')
                : '-';
            $sheet->setCellValueExplicit("H{$row}", $kunjunganTerakhirStr, DataType::TYPE_STRING);

            $sheet->getStyle("C{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("D{$row}:G{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
            $sheet->getStyle("H{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

            $row++;
        }

        $this->autoFitColumns($sheet, $cols);
    }

    private function buildSheetLapangan(Spreadsheet $spreadsheet, string $startDate, string $endDate, ?int $idLapangan = null): void
    {
        $sheet = $spreadsheet->createSheet();
        $sheet->setTitle('Lapangan');

        $headers = [
            'Tanggal',
            'Lapangan',
            'Karpet / Vinil',
            'Net',
            'Tiang',
            'Lampu',
            'Lantai',
            'Dinding',
            'Catatan',
            'Pemeriksa',
        ];

        $cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

        foreach ($headers as $idx => $h) {
            $sheet->setCellValue($cols[$idx] . '1', $h);
        }

        $this->applySheetStyles($sheet, 'J', 1);

        $lapanganService = new LaporanLapanganService();
        $riwayatList = $lapanganService->getSemuaRiwayatPemeriksaan($startDate, $endDate, $idLapangan);

        $kondisiLabels = \App\Models\PemeriksaanLapangan::DAFTAR_KONDISI;

        $row = 2;
        foreach ($riwayatList as $item) {
            $sheet->setCellValueExplicit("A{$row}", $item->tanggal_pemeriksaan->format('d/m/Y'), DataType::TYPE_STRING);
            $sheet->setCellValueExplicit("B{$row}", $this->sanitizeText($item->lapangan?->nama_lapangan ?? '-'), DataType::TYPE_STRING);
            $sheet->setCellValueExplicit("C{$row}", $this->sanitizeText($kondisiLabels[$item->karpet_vinil] ?? $item->karpet_vinil), DataType::TYPE_STRING);
            $sheet->setCellValueExplicit("D{$row}", $this->sanitizeText($kondisiLabels[$item->net] ?? $item->net), DataType::TYPE_STRING);
            $sheet->setCellValueExplicit("E{$row}", $this->sanitizeText($kondisiLabels[$item->tiang] ?? $item->tiang), DataType::TYPE_STRING);
            $sheet->setCellValueExplicit("F{$row}", $this->sanitizeText($kondisiLabels[$item->lampu] ?? $item->lampu), DataType::TYPE_STRING);
            $sheet->setCellValueExplicit("G{$row}", $this->sanitizeText($kondisiLabels[$item->lantai] ?? $item->lantai), DataType::TYPE_STRING);
            $sheet->setCellValueExplicit("H{$row}", $this->sanitizeText($kondisiLabels[$item->dinding] ?? $item->dinding), DataType::TYPE_STRING);
            $sheet->setCellValueExplicit("I{$row}", $this->sanitizeText($item->catatan ?? '-'), DataType::TYPE_STRING);
            $sheet->setCellValueExplicit("J{$row}", $this->sanitizeText($item->pemeriksa?->nama ?? '-'), DataType::TYPE_STRING);

            $sheet->getStyle("A{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("B{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
            $sheet->getStyle("C{$row}:H{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("I{$row}:J{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);

            $row++;
        }

        $this->autoFitColumns($sheet, $cols);
    }
}


