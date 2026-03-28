import { Link } from "react-router-dom";
import { getDashboardRoute } from "../utils/session";
import "../../../pages/AddProduct.css";

export default function CustomerAddServiceRecordPage() {
  return (
    <section className="add-product-page">
      <div className="add-product-page__backdrop"></div>
      <div className="add-product-layout">
        <div className="add-product-hero">
          <div className="add-product-hero__heading">
            <h1>Service records are managed by the mechanic portal.</h1>
            <p>
              Customers can track service history from the dashboard, but adding
              or editing service records is restricted to the mechanic side.
            </p>
          </div>
        </div>

        <div className="add-product-card">
          <div className="add-product-card__header">
            <p className="add-product-card__eyebrow">Customer Access</p>
            <h2>Read-only service access</h2>
            <span>Your dashboard already shows the latest updates for each vehicle.</span>
          </div>

          <Link className="add-product-card__button" to={getDashboardRoute()}>
            Back to dashboard
          </Link>
        </div>
      </div>
    </section>
  );
}
