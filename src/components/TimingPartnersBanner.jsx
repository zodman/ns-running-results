import React from "react";
import { ArrowUpRight } from "lucide-react";

const ATLANTIC_CHIP_URL =
  "https://www.atlanticchip.ca/?utm_source=ns_running_results&utm_medium=referral&utm_campaign=timing_partner_banner";
const ROUTE541_URL =
  "https://www.route541.com/?utm_source=ns_running_results&utm_medium=referral&utm_campaign=timing_partner_banner";

export default function TimingPartnersBanner({ className = "" }) {
  return (
    <aside
      className={`timing-partners-banner ${className}`}
      aria-label="Official timing partners: Atlantic Chip and Route541"
    >
      <div className="partners-banner-inner">
        <div className="partners-banner-left">
          <span className="partners-banner-text">
            <strong className="partners-banner-title">
              Powered by Atlantic Chip &amp; Route541
            </strong>
            <span className="partners-banner-sep" aria-hidden="true">
              •
            </span>
            <span className="partners-banner-desc">
              Without Atlantic Chip and Route541, this website is not possible.
            </span>
          </span>
        </div>

        <div className="partners-banner-right">
          <div className="partners-links-group">
            <a
              href={ATLANTIC_CHIP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="partner-card-link"
              title="Visit Atlantic Chip Sport-Stats official website"
            >
              <img
                src="/logos/atlantic_chip.png"
                alt="Atlantic Chip"
                className="partner-logo-img"
              />
              <span className="partner-name">Atlantic Chip</span>
              <ArrowUpRight size={13} className="partner-arrow" />
            </a>

            <a
              href={ROUTE541_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="partner-card-link"
              title="Visit Route541 official website"
            >
              <img
                src="/logos/route541.png"
                alt="Route541"
                className="partner-logo-img"
              />
              <span className="partner-name">Route541</span>
              <ArrowUpRight size={13} className="partner-arrow" />
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
}
