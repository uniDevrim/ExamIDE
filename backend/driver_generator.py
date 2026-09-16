"""
Driver Generator Modülü
Fonksiyon tabanlı sorular için test case sürücüsü (driver/harness) ve
öğrenci başlangıç kodu (starter code) üretir.
"""

import json
from typing import List, Dict, Any, Optional


def _map_cpp_type(t: Optional[str]) -> str:
    """JSON'dan gelen tip string'ini geçerli C++ tipine dönüştürür."""
    if not t:
        return "void"
    t = t.strip()
    mapping = {
        "int": "int",
        "float": "float",
        "double": "double",
        "bool": "bool",
        "boolean": "bool",
        "string": "std::string",
        "str": "std::string",
        "char": "char",
        "long": "long long",
        "void": "void"
    }
    low = t.lower()
    if low in mapping:
        return mapping[low]

    # std::vector desteği (örn: list<int>, vector<int>, int[])
    if low.startswith("vector<") or low.startswith("std::vector<"):
        return t if t.startswith("std::") else f"std::{t}"
    if low.startswith("list<"):
        inner = t[5:-1]
        return f"std::vector<{_map_cpp_type(inner)}>"
    if low.endswith("[]"):
        inner = t[:-2]
        return f"std::vector<{_map_cpp_type(inner)}>"

    return t


def generate_python_driver(student_code: str, function_name: str) -> str:
    """
    Python için test runner driver kodu üretir.
    stdin'den JSON test senaryolarını okur, öğrenci fonksiyonunu çağırır ve
    her testin sonucunu stdout'a JSON dizisi olarak yazar.
    """
    driver_template = f'''# --- Öğrenci Kodu Başlangıcı ---
{student_code}
# --- Öğrenci Kodu Sonu ---

import sys
import json
import io

def __run_driver():
    raw_input = sys.stdin.read()
    if not raw_input.strip():
        print("[]")
        return

    try:
        test_cases = json.loads(raw_input)
    except Exception as e:
        err_res = [{{"index": 0, "status": "error", "error_type": "input_parse", "message": f"Test verisi parse edilemedi: {{str(e)}}"}}]
        print(json.dumps(err_res, ensure_ascii=False))
        return

    results = []
    func = globals().get({repr(function_name)})
    if not callable(func):
        for i in range(len(test_cases)):
            results.append({{
                "index": i,
                "status": "error",
                "error_type": "runtime",
                "message": f"{function_name} fonksiyonu bulunamadı veya çağrılabilir değil."
            }})
        print(json.dumps(results, ensure_ascii=False))
        return

    real_stdout = sys.stdout
    for i, tc in enumerate(test_cases):
        args = tc.get("input", [])
        if not isinstance(args, (list, tuple)):
            args = [args]

        captured_out = io.StringIO()
        sys.stdout = captured_out
        try:
            res = func(*args)
            sys.stdout = real_stdout
            results.append({{
                "index": i,
                "status": "success",
                "output": res
            }})
        except Exception as err:
            sys.stdout = real_stdout
            results.append({{
                "index": i,
                "status": "error",
                "error_type": "runtime",
                "message": str(err)
            }})

    real_stdout.write(json.dumps(results, ensure_ascii=False))

if __name__ == "__main__":
    __run_driver()
'''
    return driver_template


def generate_cpp_driver(student_code: str, function_name: str, parameters: List[Dict[str, Any]], return_type: str) -> str:
    """
    C++ için test runner driver kodu üretir.
    nlohmann/json kütüphanesini kullanarak stdin'den JSON test case'lerini deserialize eder,
    fonksiyonu çağırır ve sonuçları JSON dizisi olarak stdout'a yazar.
    """
    cpp_return_type = _map_cpp_type(return_type)

    # Parametre deserializasyonu ve argüman listesi
    arg_extractions = []
    arg_names = []

    for i, p in enumerate(parameters):
        p_name = p.get("name", f"param_{i}")
        p_type = _map_cpp_type(p.get("type", "int"))
        arg_names.append(p_name)
        extraction = (
            f"            {p_type} {p_name};\n"
            f"            if (input_val.is_array() && {i} < input_val.size()) {{\n"
            f"                {p_name} = input_val[{i}].get<{p_type}>();\n"
            f"            }} else if (!input_val.is_array() && {i} == 0) {{\n"
            f"                {p_name} = input_val.get<{p_type}>();\n"
            f"            }}"
        )
        arg_extractions.append(extraction)

    extractions_str = "\n".join(arg_extractions)
    args_pass_str = ", ".join(arg_names)

    call_and_output = ""
    if cpp_return_type == "void":
        call_and_output = (
            f"            {function_name}({args_pass_str});\n"
            f"            results.push_back({{\n"
            f"                {{\"index\", i}},\n"
            f"                {{\"status\", \"success\"}},\n"
            f"                {{\"output\", nullptr}}\n"
            f"            }});"
        )
    else:
        call_and_output = (
            f"            auto func_res = {function_name}({args_pass_str});\n"
            f"            results.push_back({{\n"
            f"                {{\"index\", i}},\n"
            f"                {{\"status\", \"success\"}},\n"
            f"                {{\"output\", func_res}}\n"
            f"            }});"
        )

    driver_code = f"""#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <exception>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

// --- Öğrenci Kodu Başlangıcı ---
{student_code}
// --- Öğrenci Kodu Sonu ---

int main() {{
    std::ios_base::sync_with_stdio(false);
    std::cin.tie(NULL);

    json test_cases;
    try {{
        std::string raw_input((std::istreambuf_iterator<char>(std::cin)), std::istreambuf_iterator<char>());
        if (raw_input.empty()) {{
            std::cout << "[]" << std::endl;
            return 0;
        }}
        test_cases = json::parse(raw_input);
    }} catch (const std::exception& e) {{
        json err_arr = json::array({{
            {{ {{"index", 0}}, {{"status", "error"}}, {{"error_type", "input_parse"}}, {{"message", e.what()}} }}
        }});
        std::cout << err_arr.dump() << std::endl;
        return 0;
    }}

    json results = json::array();
    for (size_t i = 0; i < test_cases.size(); ++i) {{
        try {{
            auto& tc = test_cases[i];
            auto input_val = tc.value("input", json::array());
{extractions_str}
{call_and_output}
        }} catch (const std::exception& e) {{
            results.push_back({{
                {{"index", i}},
                {{"status", "error"}},
                {{"error_type", "runtime"}},
                {{"message", e.what()}}
            }});
        }} catch (...) {{
            results.push_back({{
                {{"index", i}},
                {{"status", "error"}},
                {{"error_type", "runtime"}},
                {{"message", "Bilinmeyen çalışma zamanı hatası"}}
            }});
        }}
    }}

    std::cout << results.dump() << std::endl;
    return 0;
}}
"""
    return driver_code


def generate_csharp_driver(student_code: str, function_name: str, parameters: List[Dict[str, Any]], return_type: str) -> str:
    """
    C# (.NET 7) için test runner driver kodu üretir.
    System.Text.Json ile stdin'i okur, Solution sınıfı ve reflection üzerinden metodu çağırır.
    """
    driver_code = f"""using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Nodes;

// --- Öğrenci Kodu Başlangıcı ---
{student_code}
// --- Öğrenci Kodu Sonu ---

public class DriverProgram
{{
    public static void Main(string[] args)
    {{
        string input = Console.In.ReadToEnd();
        if (string.IsNullOrWhiteSpace(input))
        {{
            Console.WriteLine("[]");
            return;
        }}

        var results = new List<Dictionary<string, object>>();
        try
        {{
            var doc = JsonNode.Parse(input)?.AsArray();
            if (doc == null)
            {{
                Console.WriteLine("[]");
                return;
            }}

            var method = typeof(Solution).GetMethod("{function_name}");
            if (method == null)
            {{
                for (int i = 0; i < doc.Count; i++)
                {{
                    results.Add(new Dictionary<string, object>
                    {{
                        {{ "index", i }},
                        {{ "status", "error" }},
                        {{ "error_type", "runtime" }},
                        {{ "message", "'{function_name}' metodu Solution sınıfında bulunamadı." }}
                    }});
                }}
                Console.WriteLine(JsonSerializer.Serialize(results));
                return;
            }}

            object instance = method.IsStatic ? null : Activator.CreateInstance(typeof(Solution));

            for (int i = 0; i < doc.Count; i++)
            {{
                try
                {{
                    var tc = doc[i];
                    var inputNode = tc?["input"];
                    var paramInfos = method.GetParameters();
                    object[] paramValues = new object[paramInfos.Length];

                    for (int p = 0; p < paramInfos.Length; p++)
                    {{
                        JsonNode valNode = inputNode is JsonArray arr && p < arr.Count ? arr[p] : (p == 0 ? inputNode : null);
                        if (valNode == null)
                        {{
                            paramValues[p] = paramInfos[p].DefaultValue;
                        }}
                        else
                        {{
                            paramValues[p] = JsonSerializer.Deserialize(valNode.ToJsonString(), paramInfos[p].ParameterType);
                        }}
                    }}

                    var retVal = method.Invoke(instance, paramValues);
                    results.Add(new Dictionary<string, object>
                    {{
                        {{ "index", i }},
                        {{ "status", "success" }},
                        {{ "output", retVal }}
                    }});
                }}
                catch (Exception ex)
                {{
                    string msg = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                    results.Add(new Dictionary<string, object>
                    {{
                        {{ "index", i }},
                        {{ "status", "error" }},
                        {{ "error_type", "runtime" }},
                        {{ "message", msg }}
                    }});
                }}
            }}
        }}
        catch (Exception ex)
        {{
            results.Add(new Dictionary<string, object>
            {{
                {{ "index", 0 }},
                {{ "status", "error" }},
                {{ "error_type", "runtime" }},
                {{ "message", ex.Message }}
            }});
        }}

        Console.WriteLine(JsonSerializer.Serialize(results));
    }}
}}
"""
    return driver_code


def generate_starter_code(lang: str, function_name: str, parameters: List[Dict[str, Any]], return_type: str) -> str:
    """
    Öğrenciye IDE'de gösterilecek boş fonksiyon başlangıç kodunu (starter code) üretir.
    """
    lang = (lang or "").lower().strip()
    if lang in ("python", "py"):
        params_str = ", ".join([p.get("name", f"param{i}") for i, p in enumerate(parameters)])
        ret_hint = f" -> {return_type}" if return_type else ""
        return f"def {function_name}({params_str}){ret_hint}:\n    pass\n"

    elif lang in ("cpp", "c++", "c"):
        cpp_ret = _map_cpp_type(return_type) if return_type else "void"
        cpp_params = []
        for i, p in enumerate(parameters):
            p_type = _map_cpp_type(p.get("type", "int"))
            p_name = p.get("name", f"param{i}")
            cpp_params.append(f"{p_type} {p_name}")
        params_str = ", ".join(cpp_params)
        return (
            f"#include <iostream>\n"
            f"#include <vector>\n"
            f"#include <string>\n\n"
            f"{cpp_ret} {function_name}({params_str}) {{\n"
            f"    // Kodunuzu buraya yazın\n"
            f"}}\n"
        )

    elif lang in ("csharp", "c#", "cs"):
        cs_ret = return_type or "void"
        cs_params = []
        for i, p in enumerate(parameters):
            p_type = p.get("type", "int")
            p_name = p.get("name", f"param{i}")
            cs_params.append(f"{p_type} {p_name}")
        params_str = ", ".join(cs_params)
        return (
            f"using System;\n"
            f"using System.Collections.Generic;\n\n"
            f"public class Solution\n"
            f"{{\n"
            f"    public static {cs_ret} {function_name}({params_str})\n"
            f"    {{\n"
            f"        // Kodunuzu buraya yazın\n"
            f"    }}\n"
            f"}}\n"
        )

    return ""
