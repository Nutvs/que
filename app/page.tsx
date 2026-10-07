"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

const KEY = "boydko_queue_shared_v5";
const CHANNEL = "boydko_queue_realtime_v5";

type Status = "WAITING" | "PREPARING" | "READY" | "DONE";
type Order = { q: string; status: Status; created: number };
type QueueState = { orders: Order[] };

const EMPTY_STATE: QueueState = { orders: [] };

function readState(): QueueState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY_STATE;
    const parsed = JSON.parse(raw) as QueueState;
    return parsed?.orders ? parsed : EMPTY_STATE;
  } catch {
    return EMPTY_STATE;
  }
}

export default function Home() {
  const [isDisplay, setIsDisplay] = useState(false);
  const [state, setState] = useState<QueueState>(EMPTY_STATE);
  const [modalOpen, setModalOpen] = useState(false);
  const [queueNo, setQueueNo] = useState("");
  const [error, setError] = useState("");

  const publish = useCallback((next: QueueState) => {
    setState(next);
    localStorage.setItem(KEY, JSON.stringify(next));
    if (typeof BroadcastChannel !== "undefined") {
      const channel = new BroadcastChannel(CHANNEL);
      channel.postMessage({ type: "state", state: next });
      channel.close();
    }
  }, []);

  useEffect(() => {
    const display = new URLSearchParams(window.location.search).get("display") === "1";
    setIsDisplay(display);
    document.title = display
      ? "BOYdKO Christmas Concert • Customer Queue"
      : "BOYdKO Christmas Concert • Queue Management";

    const initial = readState();
    setState(initial);

    const onStorage = (event: StorageEvent) => {
      if (event.key !== KEY || !event.newValue) return;
      try {
        setState(JSON.parse(event.newValue));
      } catch {}
    };
    window.addEventListener("storage", onStorage);

    const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(CHANNEL) : null;
    if (channel) {
      channel.onmessage = (event) => {
        if (event.data?.type === "state" && event.data.state) {
          setState(event.data.state);
          localStorage.setItem(KEY, JSON.stringify(event.data.state));
        }
      };
    }

    return () => {
      window.removeEventListener("storage", onStorage);
      channel?.close();
    };
  }, []);

  const waiting = useMemo(() => state.orders.filter((o) => o.status === "WAITING"), [state.orders]);
  const preparing = useMemo(() => state.orders.filter((o) => o.status === "PREPARING"), [state.orders]);
  const ready = useMemo(() => state.orders.filter((o) => o.status === "READY"), [state.orders]);
  const done = useMemo(() => state.orders.filter((o) => o.status === "DONE"), [state.orders]);
  const work = useMemo(() => [...waiting, ...preparing], [waiting, preparing]);

  const setStatus = (q: string, status: Status) => {
    const next = { orders: state.orders.map((order) => order.q === q ? { ...order, status } : order) };
    publish(next);
  };

  const createQueue = () => {
    const q = queueNo.trim().toUpperCase().replace(/\s+/g, "");
    if (!q) {
      setError("กรุณาคีย์เลขคิว");
      return;
    }
    if (state.orders.some((o) => o.q.toUpperCase() === q && o.status !== "DONE")) {
      setError("เลขคิวนี้มีอยู่ในระบบแล้ว กรุณาใช้เลขอื่น");
      return;
    }
    publish({ orders: [...state.orders, { q, status: "WAITING", created: Date.now() }] });
    setQueueNo("");
    setError("");
    setModalOpen(false);
  };

  const openDisplay = () => {
    const url = `${window.location.origin}${window.location.pathname}?display=1`;
    const popup = window.open(url, "queueCustomerDisplay", "width=1400,height=900");
    if (!popup) window.alert("Popup ถูกบล็อก กรุณาอนุญาต Popup สำหรับเว็บไซต์นี้แล้วลองอีกครั้ง");
  };

  const reset = () => {
    if (window.confirm("ล้างคิวทั้งหมดจริงหรือไม่?")) publish(EMPTY_STATE);
  };

  if (isDisplay) {
    return (
      <main className="display-page">
        <section className="tv">
          <div className="tvbg" />
          <div className="tvcontent">
            <div className="tvhead">
              <div className="event-lockup">
                <Image className="event-logo" src="/boydko-logo.png" alt="BOYdKO Christmas Concert" width={1060} height={530} priority />
                <div className="queue-label">QUEUE BOARD</div>
                <div className="sub">จุดรับสินค้า • SURPRISE AFTER SURPRISE</div>
              </div>
              <div className="live">● LIVE • CONNECTED</div>
            </div>
            <div className="tvgrid">
              <QueueBox title="🔵 กำลังจัดเตรียมสินค้า" hint="PLEASE WAIT" queues={preparing} />
              <QueueBox title="🟢 พร้อมรับสินค้า" hint="PLEASE COLLECT" queues={ready} ready />
            </div>
            <div className="footer">ขอบคุณที่ร่วมสนุกกับ BOYdKO CHRISTMAS CONCERT ❤️</div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <>
      <header>
        <div>
          <strong className="header-title">QUEUE MANAGEMENT</strong>
          <div className="header-sub">BOYdKO CHRISTMAS CONCERT</div>
        </div>
        <div className="connection">● SYNC ONLINE</div>
      </header>

      <div className="hero"><Image src="/kv.png" alt="BOYdKO Christmas Concert Key Visual" width={1672} height={941} priority /></div>

      <main className="wrap">
        <section className="admin">
          <div className="toolbar">
            <button className="primary" onClick={() => { setModalOpen(true); setQueueNo(""); setError(""); }}>＋ สร้างออเดอร์ / คิวใหม่</button>
            <button onClick={openDisplay}>📺 เปิดหน้าจอลูกค้า</button>
            <button onClick={reset}>ล้างข้อมูลทั้งหมด</button>
          </div>

          <div className="stats">
            <Stat label="รอจัด" value={waiting.length} />
            <Stat label="กำลังจัด" value={preparing.length} />
            <Stat label="พร้อมรับ" value={ready.length} />
            <Stat label="รับแล้ว" value={done.length} />
          </div>

          <div className="grid">
            <section className="card">
              <h2>จัดสินค้า</h2>
              <p className="muted">เลือกคิวไหนก่อนก็ได้</p>
              <div className="list">
                {work.length ? work.map((order) => (
                  <div className={`row ${order.status === "WAITING" ? "wait" : "prep"}`} key={order.q}>
                    <div><div className="q">{order.q}</div><div className="muted">{order.status === "WAITING" ? "รอจัด" : "กำลังจัด"}</div></div>
                    <div className="actions">
                      {order.status === "WAITING"
                        ? <button className="primary" onClick={() => setStatus(order.q, "PREPARING")}>เริ่มจัด</button>
                        : <button onClick={() => setStatus(order.q, "READY")}>จัดเสร็จ → พร้อมรับ</button>}
                    </div>
                  </div>
                )) : <div className="empty">ยังไม่มีคิว</div>}
              </div>
            </section>

            <section className="card">
              <h2>พร้อมรับสินค้า</h2>
              <p className="muted">คิวที่จัดเสร็จแล้ว</p>
              <div className="list">
                {ready.length ? ready.map((order) => (
                  <div className="row ready" key={order.q}>
                    <div><div className="q">{order.q}</div><div className="muted">พร้อมรับ</div></div>
                    <div className="actions"><button onClick={() => setStatus(order.q, "DONE")}>ส่งมอบแล้ว</button></div>
                  </div>
                )) : <div className="empty">ยังไม่มีคิวพร้อมรับ</div>}
              </div>
            </section>
          </div>
        </section>
      </main>

      {modalOpen && (
        <div className="modal" onMouseDown={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <div className="modalbox">
            <h2>สร้างออเดอร์ใหม่</h2>
            <p className="muted">คีย์เลขคิวเองได้ เช่น A101, 001, 25 หรือ VIP-08</p>
            <label htmlFor="queueNo">เลขคิว</label>
            <input id="queueNo" value={queueNo} maxLength={20} placeholder="เช่น A101" autoFocus autoComplete="off" onChange={(e) => { setQueueNo(e.target.value); setError(""); }} onKeyDown={(e) => { if (e.key === "Enter") createQueue(); }} />
            {error && <div className="error">{error}</div>}
            <div className="modal-actions"><button onClick={() => setModalOpen(false)}>ยกเลิก</button><button className="primary" onClick={createQueue}>สร้างคิว</button></div>
          </div>
        </div>
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="card stat"><span className="muted">{label}</span><b>{value}</b></div>;
}

function QueueBox({ title, hint, queues, ready = false }: { title: string; hint: string; queues: Order[]; ready?: boolean }) {
  return (
    <div className={`tvbox ${ready ? "ready" : ""}`}>
      <div className="tvstatus">{title}</div>
      <div className="hint">{hint}</div>
      <div className="nums">
        {queues.length ? queues.map((order) => <span className="num" key={order.q}>{order.q}</span>) : <span className="muted">ไม่มีคิว</span>}
      </div>
    </div>
  );
}
