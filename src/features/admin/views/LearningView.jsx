import { MetricCard, Panel, RankedList, SectionHeader, StatusRows } from '../components/DashboardPrimitives';

export function LearningView({ stats }) {
  return (
    <section className="admin-section">
      <SectionHeader title="Learning resources" subtitle="Tài liệu, file và link theo skill" />
      <div className="metric-grid compact">
        <MetricCard label="Skills" value={stats.learningResources.totalSkills} detail={`${stats.learningResources.activeSkills} active`} />
        <MetricCard label="Resources" value={stats.learningResources.total} detail={`${stats.learningResources.active} active`} />
        <MetricCard label="Files" value={stats.learningResources.fileResources} detail={`${stats.learningResources.linkResources} links`} />
        <MetricCard label="Career roles" value={stats.careerRoles.total} detail={`${stats.careerRoles.active} active`} />
      </div>
      <div className="split-grid">
        <Panel title="Resources by skill"><RankedList items={stats.learningResources.bySkill} labelKey="skillName" valueKey="total" /></Panel>
        <Panel title="Resource types"><StatusRows items={(stats.learningResources.byResourceType || []).map((item) => [item.name, item.count])} /></Panel>
      </div>
    </section>
  );
}
