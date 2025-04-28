using Microsoft.AspNetCore.Mvc;
using Stimulsoft.Report;
using System.IO;

namespace ReportGeneratorService.Controllers
{
    [ApiController]
    [Route("api/report-generator")]
    public class ReportController : ControllerBase
    {
        [HttpPost("generate")]
        public IActionResult GenerateReport([FromBody] ReportRequest request)
        {
            try
            {
                // Carrega o modelo de relatório existente
                var reportPath = Path.Combine(Directory.GetCurrentDirectory(), "Templates", "Relatorio.mrt");
                var report = new StiReport();
                report.Load(reportPath);

                // Atualiza os campos no relatório com base nos campos selecionados
                var dataTable = new System.Data.DataTable("FonteDeDados");
                foreach (var field in request.Fields)
                {
                    dataTable.Columns.Add(field, typeof(string)); // Adiciona as colunas ao DataTable
                }

                // Adiciona o DataTable ao relatório
                report.RegData("FonteDeDados", dataTable);

                // Retorna o código do relatório como string
                using (var stream = new MemoryStream())
                {
                    report.Save(stream);
                    stream.Position = 0;
                    using (var reader = new StreamReader(stream))
                    {
                        var reportContent = reader.ReadToEnd();
                        return Ok(new { success = true, reportCode = reportContent });
                    }
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }
    }

    public class ReportRequest
    {
        public string[]? Fields { get; set; } // Permite que o valor seja nulo
    }
}