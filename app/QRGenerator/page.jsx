"use client";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Download } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";


function getUserIdFromToken() {
  const token = Cookies.get("token");
  if (!token) return null;
  try {
    const decoded = jwtDecode(token);
    return decoded.userId;
  } catch {
    return null;
  }
}


export default function QRGenerator() {
  // Replace with actual restaurant/user ID from auth in production
  const restaurantId=getUserIdFromToken();
  const [table, setTable] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const handleGenerate = (e) => {
    e.preventDefault();
    if (!table) return;
    const url = `${window.location.origin}/customer?restaurant=${restaurantId}&table=${encodeURIComponent(table)}`;
    setQrUrl(url);
    setCopied(false);
  };

  const handleCopy = () => {
    if (qrUrl) {
      navigator.clipboard.writeText(qrUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

 const handleDownload = () => {
  const svg = document.getElementById("qr-canvas");
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svg);

  const canvas = document.createElement("canvas");
  const img = new window.Image();
  img.onload = function () {
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const pngUrl = canvas.toDataURL("image/png");
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `table-${table}-qr.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };
  img.src = "data:image/svg+xml;base64," + window.btoa(unescape(encodeURIComponent(svgString)));
};

  return (
    <div className="container py-5">
        <Sidebar/>
      <div className="row justify-content-center">
        <div className="col-lg-7">
          <div className="card shadow-lg border-0">
            <div className="card-header bg-primary text-white">
              <h3 className="mb-0 fw-bold">QR Generator</h3>
              <div className="small text-white-50">Create QR codes for your tables</div>
            </div>
            <div className="card-body">
              <form className="row g-3 align-items-end" onSubmit={handleGenerate}>
                <div className="col-md-8">
                  <label className="form-label fw-semibold">Table Number / Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 1, 2, VIP, Patio-3"
                    value={table}
                    onChange={e => setTable(e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <button className="btn btn-primary btn-lg w-100" type="submit">
                    Generate QR
                  </button>
                </div>
              </form>
              {qrUrl && (
                <div className="mt-5 text-center">
                  <div className="mb-3">
                    <QRCodeSVG
                      id="qr-canvas"
                      value={qrUrl}
                      size={220}
                      bgColor="#fff"
                      fgColor="#212529"
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <div className="mb-2">
                    <button className="btn btn-outline-secondary me-2" onClick={handleCopy}>
                      <Copy size={18} className="me-1" />
                      {copied ? "Copied!" : "Copy Link"}
                    </button>
                    <button className="btn btn-outline-success" onClick={handleDownload}>
                      <Download size={18} className="me-1" />
                      Download QR
                    </button>
                  </div>
                  <div className="small text-muted mt-2">
                    <span className="fw-semibold">Scan URL:</span> <span style={{ wordBreak: "break-all" }}>{qrUrl}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}