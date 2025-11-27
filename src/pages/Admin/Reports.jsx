import React from "react";
import { AdminAPI } from "../../utils/auth";

function Reports() {
  const deliveriesUrl = AdminAPI.reports.deliveriesCsv();
  const paymentsUrl = AdminAPI.reports.paymentsCsv();

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Reports</h1>
      <div className="space-x-2">
        <a href={deliveriesUrl} className="px-4 py-2 bg-blue-600 text-white rounded" download>
          Download Deliveries CSV
        </a>
        <a href={paymentsUrl} className="px-4 py-2 bg-green-600 text-white rounded" download>
          Download Payments CSV
        </a>
      </div>
      <p className="text-gray-600 text-sm">CSV downloads require admin authentication.</p>
    </div>
  );
}

export default Reports;
