var apiUrl = null;

chrome.runtime.sendMessage({messageName: "getApiUrl"}, function(resp) {
  apiUrl = resp.url;
});

function runCode(payload, successCb, errorCb) {
  $.ajax({
    url: apiUrl + "/run",
    method: "POST",
    data: payload,
    success: successCb,
    error: function(resp) {
      if (resp.responseJSON) {
        return errorCb("ERROR: " + resp.responseJSON.error);
      }
      errorCb(resp.responseText);
    }
  });
}

function renderOutput(format, text, container, error) {
  var term = $("<div/>").addClass("bitrun-output");

  if (format.indexOf("plain/text") >= 0) {
    var output = ansi_up.ansi_to_html(text);
    var lines  = output.split("\r\n");

    for (i in lines) {
      lines[i] = "<div>" + lines[i] + "</div>";
    }

    term.html(lines.join(""));
  }
  else {
    term.html(text);
  }

  if (error) {
    term.addClass("error");
  }

  if (container.find(".blob-wrapper").length) {
    term.insertBefore(container.find(".blob-wrapper"));
  }
  else {
    if (container.find(".blob").length) {
      term.insertBefore(container.find(".blob"));
    }
    else {
      term.insertBefore(container.find(".commit-create")); 
    }
  }

  term.slideDown("fast");
  term.scrollTop(term[0].scrollHeight);
}

$(document).ready(function() {
  $(".file-actions").each(function(idx, el) {
    var btn = $("<a/>").
      prop("class", "btn btn-sm btn-primary bitrun-execute").
      prop("href", "#").
      text("Run")

    btn.prependTo($(el));
  });

  $("body").on("click", "a.bitrun-execute", function(e) {
    e.preventDefault();

    var btn       = $(this);
    var container = $(this).closest(".file");

    if (btn.hasClass("working")) return;
    btn.addClass("working").text("Running...");
    $(container).find(".bitrun-output").slideUp().remove();

    var payload = {};

    if (container.find("textarea").length > 0) {
      payload.content = container.find("textarea").val();
    } else {
      payload.content = container.find(".blob-code-inner").map(function() { return $(this).text(); }).get().join("\n");
    }

    if (container.find(".gist-blob-name").length) {
      payload.filename = container.find(".gist-blob-name").text().trim();
    }
    else {
      payload.filename = container.find(".js-blob-filename").val().trim();
    }

    var onSuccess = function(text, status, req) {
      btn.removeClass("working").text("Run");
      var code = parseInt(req.getResponseHeader("x-run-exitcode"));
      var format = req.getResponseHeader("content-type");
      renderOutput(format, text, container, code > 0);
    }

    var onError = function(text) {
      btn.removeClass("working").text("Run");
      renderOutput("text/plain", text, container, true);
    }

    runCode(payload, onSuccess, onError);
  });
});